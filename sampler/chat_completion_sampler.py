import time
from typing import Any

import openai
from openai import OpenAI

from eval_types import MessageList, SamplerBase, SamplerResponse

OPENAI_SYSTEM_MESSAGE_API = "You are a helpful assistant."
OPENAI_SYSTEM_MESSAGE_CHATGPT = (
    "You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture."
    + "\nKnowledge cutoff: 2023-12\nCurrent date: 2024-04-01"
)


class ChatCompletionSampler(SamplerBase):
    """
    Sample from OpenAI's chat completion API
    """

    def __init__(
        self,
        model: str = "gpt-3.5-turbo",
        system_message: str | None = None,
        temperature: float = 0.5,
        max_tokens: int = 1024,
    ):
        self.api_key_name = "OPENAI_API_KEY"
        self.client = OpenAI()
        # using api_key=os.environ.get("OPENAI_API_KEY")  # please set your API_KEY
        self.model = model
        self.system_message = system_message
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.image_format = "url"

    def _handle_image(
        self,
        image: str,
        encoding: str = "base64",
        format: str = "png",
        fovea: int = 768,
    ):
        new_image = {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/{format};{encoding},{image}",
            },
        }
        return new_image

    def _handle_text(self, text: str):
        return {"type": "text", "text": text}

    def _pack_message(self, role: str, content: Any):
        return {"role": str(role), "content": content}

    def __call__(self, message_list: MessageList) -> SamplerResponse:
        if self.system_message:
            message_list = [
                self._pack_message("system", self.system_message)
            ] + message_list
        
        # Try to detect if model supports vision by checking for image content
        has_images = any(
            isinstance(msg.get("content"), list) and 
            any(item.get("type") in ["image", "image_url"] for item in msg.get("content", []))
            for msg in message_list
        )
        
        # Non-vision models that we know about
        non_vision_models = {"gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"}
        
        # If model doesn't support vision and we have images, filter them out
        if has_images and self.model in non_vision_models:
            print(f"Warning: {self.model} doesn't support images. Filtering out image content.")
            filtered_messages = []
            for msg in message_list:
                if isinstance(msg.get("content"), list):
                    # Keep only text content
                    text_content = [
                        item for item in msg.get("content", [])
                        if item.get("type") == "text"
                    ]
                    if text_content:
                        filtered_messages.append({
                            "role": msg["role"],
                            "content": text_content[0]["text"]  # Convert back to simple text
                        })
                else:
                    # Keep non-list content as-is
                    filtered_messages.append(msg)
            message_list = filtered_messages
        
        trial = 0
        while True:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=message_list,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                )
                content = response.choices[0].message.content
                if content is None:
                    raise ValueError("OpenAI API returned empty response; retrying")
                return SamplerResponse(
                    response_text=content,
                    response_metadata={"usage": response.usage},
                    actual_queried_message_list=message_list,
                )
            # NOTE: BadRequestError is triggered once for MMMU, please uncomment if you are reruning MMMU
            except openai.BadRequestError as e:
                print("Bad Request Error", e)
                return SamplerResponse(
                    response_text="No response (bad request).",
                    response_metadata={"usage": None},
                    actual_queried_message_list=message_list,
                )
            except Exception as e:
                exception_backoff = 2**trial  # expontial back off
                print(
                    f"Rate limit exception so wait and retry {trial} after {exception_backoff} sec",
                    e,
                )
                time.sleep(exception_backoff)
                trial += 1
                if trial > 5:  # Limit retries
                    raise e
