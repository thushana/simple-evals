import logging
from pathlib import Path
from typing import List, Optional, Tuple

from pdf2image import convert_from_path
from PIL import Image  # type: ignore

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Handle PDF to image conversion and image processing operations"""

    def __init__(self, uploads_dir: Path, images_dir: Path):
        self.uploads_dir = uploads_dir
        self.images_dir = images_dir

    def pdf_to_images(
        self, pdf_path: Path, dpi: int = 300, output_dir: Optional[Path] = None, slug: Optional[str] = None
    ) -> List[Path]:
        """
        Convert PDF pages to high-resolution images

        Args:
            pdf_path: Path to the PDF file
            dpi: Resolution for image conversion (default: 300)
            output_dir: Optional output directory (default: uses self.images_dir)

        Returns:
            List of paths to generated images
        """
        try:
            # Convert PDF to images
            images = convert_from_path(pdf_path, dpi=dpi)

            # Use provided output directory or default
            if output_dir:
                exam_dir = output_dir
            else:
                # Create exam-specific directory in default location
                exam_name = pdf_path.stem
                exam_dir = self.images_dir / exam_name
                exam_dir.mkdir(exist_ok=True)

            image_paths = []
            for i, image in enumerate(images):
                prefix = f"{slug}_" if slug else ""
                # Save full-resolution image
                image_filename = f"{prefix}page_{i+1:03d}_full.png"
                image_path = exam_dir / image_filename
                image.save(image_path, "PNG", optimize=True)
                image_paths.append(image_path)

                # Generate thumbnail (72 DPI equivalent)
                thumbnail = image.copy()
                thumbnail.thumbnail((800, 800), Image.Resampling.LANCZOS)
                thumb_filename = f"{prefix}page_{i+1:03d}_thumb.png"
                thumb_path = exam_dir / thumb_filename
                thumbnail.save(thumb_path, "PNG", optimize=True)

                logger.info(f"Generated images for page {i+1}: {image_path.name}, {thumb_path.name}")

            return image_paths

        except Exception as e:
            logger.error(f"Error converting PDF to images: {str(e)}")
            raise

    def crop_image(self, image_path: Path, crop_coords: Tuple[int, int, int, int], padding: int = 5) -> Path:
        """
        Crop an image to specified coordinates and add padding

        Args:
            image_path: Path to the source image
            crop_coords: Tuple of (left, top, right, bottom) coordinates
            padding: Padding to add around the cropped area (default: 5px)

        Returns:
            Path to the cropped image
        """
        try:
            with Image.open(image_path) as img:
                # Crop the image
                cropped = img.crop(crop_coords)

                # Add padding
                if padding > 0:
                    # Create new image with padding
                    new_size = (cropped.width + 2 * padding, cropped.height + 2 * padding)
                    padded = Image.new("RGB", new_size, "white")
                    padded.paste(cropped, (padding, padding))
                    cropped = padded

                # Save cropped image
                crop_filename = f"{image_path.stem}_cropped.png"
                crop_path = image_path.parent / crop_filename
                cropped.save(crop_path, "PNG", optimize=True)

                logger.info(f"Cropped image saved: {crop_path.name}")
                return crop_path

        except Exception as e:
            logger.error(f"Error cropping image: {str(e)}")
            raise

    def trim_whitespace(self, image_path: Path, threshold: int = 250) -> Path:
        """
        Trim whitespace from an image

        Args:
            image_path: Path to the source image
            threshold: Threshold for considering a pixel as white (0-255)

        Returns:
            Path to the trimmed image
        """
        try:
            with Image.open(image_path) as img:
                # Convert to grayscale for analysis
                gray = img.convert("L")

                # Get bounding box of non-white pixels
                bbox = gray.point(lambda x: 0 if x > threshold else 255).getbbox()

                if bbox:
                    # Crop to bounding box
                    trimmed = img.crop(bbox)

                    # Save trimmed image
                    trim_filename = f"{image_path.stem}_trimmed.png"
                    trim_path = image_path.parent / trim_filename
                    trimmed.save(trim_path, "PNG", optimize=True)

                    logger.info(f"Trimmed image saved: {trim_path.name}")
                    return trim_path
                else:
                    logger.warning("No content found in image to trim")
                    return image_path

        except Exception as e:
            logger.error(f"Error trimming image: {str(e)}")
            raise

    def add_padding(self, image_path: Path, padding: int = 5, color: str = "white") -> Path:
        """
        Add padding around an image

        Args:
            image_path: Path to the source image
            padding: Padding to add (default: 5px)
            color: Color of the padding (default: white)

        Returns:
            Path to the padded image
        """
        try:
            with Image.open(image_path) as img:
                # Create new image with padding
                new_size = (img.width + 2 * padding, img.height + 2 * padding)
                padded = Image.new("RGB", new_size, color)
                padded.paste(img, (padding, padding))

                # Save padded image
                pad_filename = f"{image_path.stem}_padded.png"
                pad_path = image_path.parent / pad_filename
                padded.save(pad_path, "PNG", optimize=True)

                logger.info(f"Padded image saved: {pad_path.name}")
                return pad_path

        except Exception as e:
            logger.error(f"Error adding padding: {str(e)}")
            raise

    def process_question_image(
        self,
        image_path: Path,
        crop_coords: Optional[Tuple[int, int, int, int]] = None,
        trim_whitespace: bool = True,
        add_padding: bool = True,
        padding: int = 5,
    ) -> Path:
        """
        Process an image for question extraction: crop, trim whitespace, add padding

        Args:
            image_path: Path to the source image
            crop_coords: Optional crop coordinates
            trim_whitespace: Whether to trim whitespace
            add_padding: Whether to add padding
            padding: Padding amount

        Returns:
            Path to the processed image
        """
        try:
            current_path = image_path

            # Step 1: Crop if coordinates provided
            if crop_coords:
                current_path = self.crop_image(current_path, crop_coords, 0)  # No padding yet

            # Step 2: Trim whitespace
            if trim_whitespace:
                current_path = self.trim_whitespace(current_path)

            # Step 3: Add padding
            if add_padding:
                current_path = self.add_padding(current_path, padding)

            # Rename to final question image
            final_filename = f"{image_path.stem}_question.png"
            final_path = image_path.parent / final_filename

            if current_path != image_path:  # If processing was done
                current_path.rename(final_path)
                logger.info(f"Question image processed: {final_path.name}")
                return final_path
            else:
                logger.info("No processing needed, returning original image")
                return image_path

        except Exception as e:
            logger.error(f"Error processing question image: {str(e)}")
            raise
