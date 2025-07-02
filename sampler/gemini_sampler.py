import time
import os
from typing import Any

import google.generativeai as genai

from eval_types import MessageList, SamplerBase, SamplerResponse
import common

GEMINI_SYSTEM_MESSAGE = (
    "When answering multiple choice questions, provide the letter (A, B, C, or D) "
    "followed by your reasoning."
)


class GeminiCompletionSampler(SamplerBase):
    """
    Sample from Google's Gemini API
    """

    def __init__(
        self,
        model: str = "gemini-1.5-flash",
        system_message: str | None = None,
        temperature: float = 0.0,
        max_tokens: int = 4096,
    ):
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Please set GOOGLE_API_KEY environment variable")
        
        genai.configure(api_key=self.api_key)
        self.model = model
        self.system_message = system_message or GEMINI_SYSTEM_MESSAGE
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.image_format = "base64"

    def _handle_image(
        self,
        image: str,
        encoding: str = "base64",
        format: str = "png",
        fovea: int = 768,
    ):
        # Gemini expects base64 data directly
        new_image = {
            "mime_type": f"image/{format}",
            "data": image,
        }
        return new_image

    def _handle_text(self, text: str):
        return {"text": text}

    def _pack_message(self, role: str, content: Any):
        # Gemini uses a different message format
        if role == "system":
            # System messages are handled differently in Gemini
            return {"role": "user", "parts": [{"text": content}]}
        elif role == "user":
            return {"role": "user", "parts": content}
        elif role == "assistant":
            return {"role": "model", "parts": [{"text": content}]}
        else:
            return {"role": role, "parts": content}

    def __call__(self, message_list: MessageList) -> SamplerResponse:
        if not common.has_only_user_assistant_messages(message_list):
            raise ValueError(f"Gemini sampler only supports user and assistant messages, got {message_list}")
        
        trial = 0
        while True:
            try:
                # Convert messages to Gemini format
                gemini_messages = []
                
                # Add system message if provided
                if self.system_message:
                    gemini_messages.append({
                        "role": "user",
                        "parts": [{"text": self.system_message}]
                    })
                    gemini_messages.append({
                        "role": "model", 
                        "parts": [{"text": "I understand. I will follow your instructions."}]
                    })
                
                # Convert user/assistant messages
                for msg in message_list:
                    if msg["role"] == "user":
                        parts = []
                        if isinstance(msg["content"], list):
                            for item in msg["content"]:
                                if item["type"] == "text":
                                    parts.append({"text": item["text"]})
                                elif item["type"] == "image" or item["type"] == "image_url":
                                    # Handle image data
                                    if item["type"] == "image_url":
                                        # Extract base64 data from data URL
                                        url = item["image_url"]["url"]
                                        if url.startswith("data:image/"):
                                            # Parse data URL to get base64 data
                                            import base64
                                            header, data = url.split(",", 1)
                                            mime_type = header.split(":")[1].split(";")[0]
                                            format = mime_type.split("/")[1]
                                            parts.append({
                                                "inline_data": {
                                                    "mime_type": mime_type,
                                                    "data": data
                                                }
                                            })
                                    else:
                                        # Direct image data
                                        parts.append({
                                            "inline_data": {
                                                "mime_type": f"image/{item.get('format', 'png')}",
                                                "data": item["source"]["data"]
                                            }
                                        })
                        else:
                            parts.append({"text": msg["content"]})
                        
                        gemini_messages.append({
                            "role": "user",
                            "parts": parts
                        })
                    elif msg["role"] == "assistant":
                        gemini_messages.append({
                            "role": "model",
                            "parts": [{"text": msg["content"]}]
                        })
                
                # Create the model
                model = genai.GenerativeModel(
                    model_name=self.model,
                    generation_config=genai.types.GenerationConfig(
                        temperature=self.temperature,
                        max_output_tokens=self.max_tokens,
                    )
                )
                
                # Generate response
                response = model.generate_content(
                    gemini_messages,
                    generation_config=genai.types.GenerationConfig(
                        temperature=self.temperature,
                        max_output_tokens=self.max_tokens,
                    )
                )
                
                if response.text is None:
                    raise ValueError("Gemini API returned empty response; retrying")
                
                return SamplerResponse(
                    response_text=response.text,
                    response_metadata={"usage": getattr(response, 'usage_metadata', None)},
                    actual_queried_message_list=message_list,
                )
                
            except Exception as e:
                exception_backoff = 2**trial  # exponential back off
                print(
                    f"Rate limit exception so wait and retry {trial} after {exception_backoff} sec",
                    e,
                )
                time.sleep(exception_backoff)
                trial += 1
                if trial > 5:  # Limit retries
                    raise e 