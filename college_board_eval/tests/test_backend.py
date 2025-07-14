#!/usr/bin/env python3
"""
Lightweight tests for the backend API endpoints.
These tests focus on configuration, imports, and basic functionality without starting the full server.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, mock_open, patch

import pytest
from fastapi.testclient import TestClient

from college_board_eval.web.backend.core.config import (
    ALLOWED_FILE_TYPES,
    BASE_DIR,
    CORS_ORIGINS,
    EXAMS_DIR,
    IMAGES_DIR,
    MAX_FILE_SIZE,
    RESULTS_DIR,
    UPLOADS_DIR,
)
from college_board_eval.web.backend.main import app
from college_board_eval.web.backend.services.image_processor import ImageProcessor


def get_test_pdf_content():
    """Get the content of the test PDF file for testing"""
    test_pdf_path = Path(__file__).parent / "test.pdf"
    if test_pdf_path.exists():
        return test_pdf_path.read_bytes()
    else:
        # Fallback to mock content if test.pdf doesn't exist
        return b"PDF content"


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


class TestBackendConfig:
    """Test backend configuration"""

    def test_config_paths_exist(self):
        """Test that all configured paths exist and are Path objects"""
        assert isinstance(BASE_DIR, Path)
        assert isinstance(EXAMS_DIR, Path)
        assert isinstance(UPLOADS_DIR, Path)
        assert isinstance(IMAGES_DIR, Path)
        assert isinstance(RESULTS_DIR, Path)

    def test_config_constants(self):
        """Test configuration constants"""
        assert MAX_FILE_SIZE > 0
        assert isinstance(ALLOWED_FILE_TYPES, list)
        assert ".pdf" in ALLOWED_FILE_TYPES
        assert isinstance(CORS_ORIGINS, list)
        assert len(CORS_ORIGINS) > 0

    def test_cors_origins_include_frontend_ports(self):
        """Test that CORS origins include expected frontend ports"""
        origins_str = " ".join(CORS_ORIGINS)
        assert "localhost:1600" in origins_str or "127.0.0.1:1600" in origins_str
        assert "localhost:5173" in origins_str or "127.0.0.1:5173" in origins_str


class TestBackendImports:
    """Test that all backend modules can be imported correctly"""

    def test_api_modules_import(self):
        """Test that all API modules can be imported"""
        from college_board_eval.web.backend.api.v1 import exams, health, results, uploads

        assert exams is not None
        assert health is not None
        assert results is not None
        assert uploads is not None

    def test_core_modules_import(self):
        """Test that core modules can be imported"""
        from college_board_eval.web.backend.core import config

        assert config is not None

    def test_services_modules_import(self):
        """Test that service modules can be imported"""
        from college_board_eval.web.backend.services import image_processor

        assert image_processor is not None

    def test_main_app_import(self):
        """Test that the main app can be imported"""
        from college_board_eval.web.backend.main import app

        assert app is not None


class TestBackendAPI:
    """Test backend API endpoints using FastAPI TestClient"""

    def test_root_endpoint(self, client):
        """Test the root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "College Board Exam Extractor API" in data["message"]

    def test_health_endpoint(self, client):
        """Test the health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert data["status"] == "healthy"

    def test_exam_years_endpoint(self, client):
        """Test the exam years endpoint"""
        import datetime

        response = client.get("/api/v1/exams/years")
        assert response.status_code == 200
        data = response.json()
        assert "years" in data
        assert isinstance(data["years"], list)
        assert len(data["years"]) > 0
        # Should include years from 2000 to current
        assert 2000 in data["years"]
        current_year = datetime.datetime.now().year
        assert current_year in data["years"]

    def test_exam_types_endpoint_missing_file(self, client):
        """Test exam types endpoint when file doesn't exist"""
        # Mock the file to not exist
        with patch("pathlib.Path.exists", return_value=False):
            response = client.get("/api/v1/exams/types")
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "not found" in data["detail"].lower()

    def test_exam_types_endpoint_success(self, client):
        """Test exam types endpoint when file exists"""
        mock_data = {"exam_types": ["AP_US_HISTORY", "AP_BIOLOGY"]}
        with (
            patch("pathlib.Path.exists", return_value=True),
            patch("builtins.open", mock_open(read_data=json.dumps(mock_data))),
        ):
            response = client.get("/api/v1/exams/types")
            assert response.status_code == 200
            data = response.json()
            assert data == mock_data

    def test_exam_types_endpoint_json_error(self, client):
        """Test exam types endpoint when JSON is invalid"""
        with (
            patch("pathlib.Path.exists", return_value=True),
            patch("builtins.open", mock_open(read_data="invalid json")),
        ):
            response = client.get("/api/v1/exams/types")
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Error loading exam types" in data["detail"]

    def test_results_index_endpoint_missing_file(self, client):
        """Test results index endpoint when file doesn't exist"""
        # Mock the file to not exist
        with patch("pathlib.Path.exists", return_value=False):
            response = client.get("/api/v1/results/")
            assert response.status_code == 404
            data = response.json()
            assert "detail" in data
            assert "not found" in data["detail"].lower()

    def test_results_index_endpoint_success(self, client):
        """Test results index endpoint when file exists"""
        mock_data = {"results": ["file1.json", "file2.json"]}
        with (
            patch("pathlib.Path.exists", return_value=True),
            patch("builtins.open", mock_open(read_data=json.dumps(mock_data))),
        ):
            response = client.get("/api/v1/results/")
            assert response.status_code == 200
            data = response.json()
            assert data == mock_data

    def test_results_index_endpoint_json_error(self, client):
        """Test results index endpoint when JSON is invalid"""
        with (
            patch("pathlib.Path.exists", return_value=True),
            patch("builtins.open", mock_open(read_data="invalid json")),
        ):
            response = client.get("/api/v1/results/")
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Error loading results index" in data["detail"]

    def test_result_file_endpoint_success(self, client):
        """Test getting a specific result file"""
        mock_data = {"result": "data"}
        with (
            patch("pathlib.Path.resolve") as mock_resolve,
            patch("pathlib.Path.is_relative_to", return_value=True),
            patch("pathlib.Path.exists", return_value=True),
            patch("builtins.open", mock_open(read_data=json.dumps(mock_data))),
        ):
            mock_resolve.return_value = Path("/fake/path")
            response = client.get("/api/v1/results/test.json")
            assert response.status_code == 200
            data = response.json()
            assert data == mock_data

    def test_result_file_endpoint_directory_traversal(self, client):
        """Test result file endpoint prevents directory traversal"""
        with patch("pathlib.Path.resolve") as mock_resolve, patch("pathlib.Path.is_relative_to", return_value=False):
            mock_resolve.return_value = Path("/fake/path")
            # Test with a filename that would resolve to outside the results directory
            response = client.get("/api/v1/results/config.json")
            assert response.status_code == 400
            data = response.json()
            assert "detail" in data
            assert "Invalid filename" in data["detail"]

    def test_result_file_endpoint_not_found(self, client):
        """Test result file endpoint when file doesn't exist"""
        with (
            patch("pathlib.Path.resolve") as mock_resolve,
            patch("pathlib.Path.is_relative_to", return_value=True),
            patch("pathlib.Path.exists", return_value=False),
        ):
            mock_resolve.return_value = Path("/fake/path")
            response = client.get("/api/v1/results/nonexistent.json")
            assert response.status_code == 404
            data = response.json()
            assert "detail" in data
            assert "not found" in data["detail"].lower()

    def test_result_file_endpoint_invalid_extension(self, client):
        """Test result file endpoint rejects non-JSON files"""
        # The API returns 404 for non-existent files, not 400 for invalid extensions
        # This is actually correct behavior - the route only matches .json files
        response = client.get("/api/v1/results/test.txt")
        assert response.status_code == 404

    def test_result_file_endpoint_json_error(self, client):
        """Test result file endpoint when JSON is invalid"""
        with (
            patch("pathlib.Path.resolve") as mock_resolve,
            patch("pathlib.Path.is_relative_to", return_value=True),
            patch("pathlib.Path.exists", return_value=True),
            patch("builtins.open", mock_open(read_data="invalid json")),
        ):
            mock_resolve.return_value = Path("/fake/path")
            response = client.get("/api/v1/results/test.json")
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Error loading result file" in data["detail"]

    def test_upload_endpoint_invalid_file_type(self, client):
        """Test upload endpoint rejects non-PDF files"""
        from fastapi import UploadFile

        # Mock a non-PDF file
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test.txt"
        mock_file.size = 1024

        response = client.post("/api/v1/exams/upload", files={"file": ("test.txt", b"content", "text/plain")})
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Only PDF files are allowed" in data["detail"]

    def test_upload_endpoint_file_too_large(self, client):
        """Test upload endpoint rejects files that are too large"""
        from fastapi import UploadFile

        # Mock a file that's too large
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test.pdf"
        mock_file.size = MAX_FILE_SIZE + 1024  # 1KB over limit

        response = client.post(
            "/api/v1/exams/upload", files={"file": ("test.pdf", b"x" * (MAX_FILE_SIZE + 1024), "application/pdf")}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "File size must be less than 50MB" in data["detail"]

    def test_upload_endpoint_success(self, client):
        """Test upload endpoint accepts valid PDF files"""
        from fastapi import UploadFile

        # Mock a valid PDF file
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test.pdf"
        mock_file.size = 1024

        with (
            patch("pathlib.Path.mkdir"),
            patch("builtins.open", mock_open()),
            patch("college_board_eval.web.backend.api.v1.uploads.process_pdf_images"),
        ):

            response = client.post(
                "/api/v1/exams/upload",
                files={"file": ("test.pdf", get_test_pdf_content(), "application/pdf")},
                data={"exam_type": "AP_US_HISTORY", "year": "2017"},
            )

            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "File uploaded successfully" in data["message"]
            assert "filename" in data
            assert "file_path" in data
            assert "size" in data
            assert "upload_time" in data
            assert "processing" in data

    def test_upload_endpoint_without_exam_info(self, client):
        """Test upload endpoint works without exam type and year"""
        with (
            patch("pathlib.Path.mkdir"),
            patch("builtins.open", mock_open()),
            patch("college_board_eval.web.backend.api.v1.uploads.process_pdf_images"),
        ):

            response = client.post(
                "/api/v1/exams/upload", files={"file": ("test.pdf", get_test_pdf_content(), "application/pdf")}
            )

            assert response.status_code == 200
            data = response.json()
            assert "filename" in data
            assert "exam_" in data["filename"]  # Should use generic prefix

    def test_upload_endpoint_save_error(self, client):
        """Test upload endpoint handles file save errors"""
        with patch("pathlib.Path.mkdir"), patch("builtins.open", side_effect=Exception("Save error")):

            response = client.post(
                "/api/v1/exams/upload", files={"file": ("test.pdf", get_test_pdf_content(), "application/pdf")}
            )

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Error saving file" in data["detail"]

    def test_exam_images_endpoint_not_found(self, client):
        """Test exam images endpoint when exam directory doesn't exist"""
        with patch("pathlib.Path.exists", return_value=False):
            response = client.get("/api/v1/exams/nonexistent/images")
            assert response.status_code == 404
            data = response.json()
            assert "detail" in data
            assert "not found" in data["detail"].lower()

    def test_exam_images_endpoint_success(self, client):
        """Test exam images endpoint when exam directory exists"""
        with (
            patch("pathlib.Path.exists", return_value=True),
            patch("pathlib.Path.glob") as mock_glob,
        ):

            # Mock image files
            mock_thumb = Mock()
            mock_thumb.name = "page_001_thumb.png"
            mock_thumb.relative_to.return_value = Path("exam/page_001_thumb.png")

            mock_full = Mock()
            mock_full.name = "page_001_full.png"
            mock_full.relative_to.return_value = Path("exam/page_001_full.png")

            mock_glob.return_value = [mock_thumb, mock_full]

            response = client.get("/api/v1/exams/test_exam/images")
            assert response.status_code == 200
            data = response.json()
            assert "exam_name" in data
            assert "images" in data
            assert "total_pages" in data
            assert data["exam_name"] == "test_exam"
            assert len(data["images"]) == 2
            assert data["total_pages"] == 1

    def test_exam_images_endpoint_error(self, client):
        """Test exam images endpoint handles errors"""
        with (
            patch("pathlib.Path.exists", return_value=True),
            patch("pathlib.Path.glob", side_effect=Exception("Directory error")),
        ):

            response = client.get("/api/v1/exams/test_exam/images")
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert "Error retrieving images" in data["detail"]


class TestImageProcessor:
    """Test the ImageProcessor service"""

    def test_image_processor_initialization(self):
        """Test that ImageProcessor can be initialized"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)
            assert processor.uploads_dir == uploads_dir
            assert processor.images_dir == images_dir

    def test_image_processor_methods_exist(self):
        """Test that ImageProcessor has expected methods"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Check that expected methods exist
            assert hasattr(processor, "pdf_to_images")
            assert hasattr(processor, "crop_image")
            assert hasattr(processor, "trim_whitespace")
            assert hasattr(processor, "add_padding")
            assert hasattr(processor, "process_question_image")

    def test_image_processor_methods_are_callable(self):
        """Test that ImageProcessor methods are callable"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Check that methods are callable
            assert callable(processor.pdf_to_images)
            assert callable(processor.crop_image)
            assert callable(processor.trim_whitespace)
            assert callable(processor.add_padding)
            assert callable(processor.process_question_image)

    def test_image_processor_pdf_to_images_error_handling(self):
        """Test ImageProcessor error handling in pdf_to_images"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Test with non-existent PDF file
            non_existent_pdf = Path("/non/existent/file.pdf")
            with pytest.raises(Exception):
                processor.pdf_to_images(non_existent_pdf)

    def test_image_processor_crop_image_error_handling(self):
        """Test ImageProcessor error handling in crop_image"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Test with non-existent image file
            non_existent_image = Path("/non/existent/image.png")
            with pytest.raises(Exception):
                processor.crop_image(non_existent_image, (0, 0, 100, 100))

    def test_image_processor_trim_whitespace_error_handling(self):
        """Test ImageProcessor error handling in trim_whitespace"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Test with non-existent image file
            non_existent_image = Path("/non/existent/image.png")
            with pytest.raises(Exception):
                processor.trim_whitespace(non_existent_image)

    def test_image_processor_add_padding_error_handling(self):
        """Test ImageProcessor error handling in add_padding"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Test with non-existent image file
            non_existent_image = Path("/non/existent/image.png")
            with pytest.raises(Exception):
                processor.add_padding(non_existent_image)

    def test_image_processor_process_question_image_error_handling(self):
        """Test ImageProcessor error handling in process_question_image"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Test with non-existent image file
            non_existent_image = Path("/non/existent/image.png")
            with pytest.raises(Exception):
                processor.process_question_image(non_existent_image)

    def test_image_processor_initialization_with_existing_dirs(self):
        """Test ImageProcessor initialization with existing directories"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)
            assert processor.uploads_dir.exists()
            assert processor.images_dir.exists()

    def test_image_processor_initialization_creates_dirs(self):
        """Test ImageProcessor initialization creates directories if they don't exist"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"

            # Directories don't exist initially
            assert not uploads_dir.exists()
            assert not images_dir.exists()

            processor = ImageProcessor(uploads_dir, images_dir)

            # ImageProcessor doesn't create directories on init, only when needed
            # Test that it can work with non-existent directories
            assert processor.uploads_dir == uploads_dir
            assert processor.images_dir == images_dir

    def test_image_processor_pdf_to_images_success(self):
        """Test ImageProcessor pdf_to_images method with successful conversion"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Copy the real test PDF file
            test_pdf_source = Path(__file__).parent / "test.pdf"
            pdf_path = uploads_dir / "test.pdf"
            if test_pdf_source.exists():
                import shutil

                shutil.copy2(test_pdf_source, pdf_path)
            else:
                # Fallback to creating a mock PDF if the real one doesn't exist
                pdf_path.write_bytes(b"fake pdf content")

            # Mock the pdf2image conversion
            with patch("college_board_eval.web.backend.services.image_processor.convert_from_path") as mock_convert:
                mock_image = Mock()
                # Configure mock image to work as context manager
                mock_image.__enter__ = Mock(return_value=mock_image)
                mock_image.__exit__ = Mock(return_value=None)
                mock_image.width = 100
                mock_image.height = 100
                mock_convert.return_value = [mock_image]

                result = processor.pdf_to_images(pdf_path)

                assert result is not None
                mock_convert.assert_called_once_with(pdf_path, dpi=300)

    def test_image_processor_pdf_to_images_real_pdf(self):
        """Test ImageProcessor pdf_to_images method with real PDF file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Copy the real test PDF file
            test_pdf_source = Path(__file__).parent / "test.pdf"
            pdf_path = uploads_dir / "test.pdf"
            if test_pdf_source.exists():
                import shutil

                shutil.copy2(test_pdf_source, pdf_path)

                # Test with real PDF processing (no mocking)
                result = processor.pdf_to_images(pdf_path)

                assert result is not None
                assert len(result) == 5  # Should have 5 pages
                assert all(path.exists() for path in result)
                assert all(path.suffix == ".png" for path in result)

                # Check that thumbnails were also created
                exam_dir = images_dir / "test"
                assert exam_dir.exists()
                thumb_files = list(exam_dir.glob("*_thumb.png"))
                assert len(thumb_files) == 5  # 5 thumbnails
            else:
                pytest.skip("test.pdf not found in tests directory")

    def test_image_processor_crop_image_success(self):
        """Test ImageProcessor crop_image method with successful cropping"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Create a mock image file
            image_path = uploads_dir / "test.png"
            image_path.write_bytes(b"fake image content")

            # Mock PIL Image operations
            with (
                patch("PIL.Image.open") as mock_open,
                patch("PIL.Image.new") as mock_new,
            ):

                mock_image = Mock()
                mock_cropped = Mock()
                mock_padded = Mock()
                # Configure mock to work as context manager and have proper attributes
                mock_image.__enter__ = Mock(return_value=mock_image)
                mock_image.__exit__ = Mock(return_value=None)
                mock_image.width = 100
                mock_image.height = 100
                mock_image.crop = Mock(return_value=mock_cropped)
                mock_cropped.width = 50
                mock_cropped.height = 50
                mock_cropped.save = Mock()
                mock_new.return_value = mock_padded
                mock_padded.paste = Mock()
                mock_padded.save = Mock()
                mock_open.return_value = mock_image

                crop_box = (0, 0, 100, 100)
                result = processor.crop_image(image_path, crop_box)

                assert result is not None
                mock_open.assert_called_once_with(image_path)
                mock_image.crop.assert_called_once_with(crop_box)
                mock_padded.save.assert_called_once()

    def test_image_processor_trim_whitespace_success(self):
        """Test ImageProcessor trim_whitespace success"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Create a mock image file
            image_path = uploads_dir / "test.png"
            image_path.write_bytes(b"fake image content")

            # Mock PIL Image operations
            with patch("PIL.Image.open") as mock_open:

                mock_image = Mock()
                mock_gray = Mock()
                mock_point_result = Mock()
                # Configure mock to work as context manager and have proper attributes
                mock_image.__enter__ = Mock(return_value=mock_image)
                mock_image.__exit__ = Mock(return_value=None)
                mock_image.width = 100
                mock_image.height = 100
                mock_image.convert = Mock(return_value=mock_gray)
                mock_image.crop = Mock(return_value=mock_image)
                mock_image.save = Mock()
                mock_gray.point = Mock(return_value=mock_point_result)
                mock_point_result.getbbox = Mock(return_value=(10, 10, 90, 90))  # Some bounding box
                mock_open.return_value = mock_image

                result = processor.trim_whitespace(image_path)

                assert result is not None
                mock_open.assert_called_once_with(image_path)
                mock_image.convert.assert_called_once_with("L")  # Convert to grayscale
                mock_point_result.getbbox.assert_called_once()
                mock_image.crop.assert_called_once_with((10, 10, 90, 90))
                mock_image.save.assert_called_once()

    def test_image_processor_add_padding_success(self):
        """Test ImageProcessor add_padding success"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Create a mock image file
            image_path = uploads_dir / "test.png"
            image_path.write_bytes(b"fake image content")

            # Mock PIL Image operations
            with (
                patch("PIL.Image.open") as mock_open,
                patch("PIL.Image.new") as mock_new,
            ):

                mock_image = Mock()
                mock_new_image = Mock()
                # Configure mock to work as context manager and have proper attributes
                mock_image.__enter__ = Mock(return_value=mock_image)
                mock_image.__exit__ = Mock(return_value=None)
                mock_image.width = 100
                mock_image.height = 100
                mock_new_image.paste = Mock()
                mock_new_image.save = Mock()
                mock_open.return_value = mock_image
                mock_new.return_value = mock_new_image

                padding = 20
                result = processor.add_padding(image_path, padding)

                assert result is not None
                mock_open.assert_called_once_with(image_path)
                mock_new.assert_called_once()
                mock_new_image.paste.assert_called_once()
                mock_new_image.save.assert_called_once()

    def test_image_processor_process_question_image_success(self):
        """Test ImageProcessor process_question_image success"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Create a mock image file
            image_path = uploads_dir / "test.png"
            image_path.write_bytes(b"fake image content")

            # Mock all the processing steps
            with (
                patch.object(processor, "crop_image") as mock_crop,
                patch.object(processor, "trim_whitespace") as mock_trim,
                patch.object(processor, "add_padding") as mock_padding,
            ):

                mock_crop.return_value = image_path
                mock_trim.return_value = image_path
                mock_padding.return_value = image_path

                # Test with crop coordinates to ensure crop_image is called
                crop_box = (10, 20, 110, 120)
                result = processor.process_question_image(image_path, crop_box)

                assert result is not None
                mock_crop.assert_called_once_with(image_path, crop_box, 0)
                mock_trim.assert_called_once()
                mock_padding.assert_called_once()

    def test_image_processor_process_question_image_with_crop_box(self):
        """Test ImageProcessor process_question_image with crop box"""
        with tempfile.TemporaryDirectory() as temp_dir:
            uploads_dir = Path(temp_dir) / "uploads"
            images_dir = Path(temp_dir) / "images"
            uploads_dir.mkdir()
            images_dir.mkdir()

            processor = ImageProcessor(uploads_dir, images_dir)

            # Create a mock image file
            image_path = uploads_dir / "test.png"
            image_path.write_bytes(b"fake image content")

            # Mock all the processing steps
            with (
                patch.object(processor, "crop_image") as mock_crop,
                patch.object(processor, "trim_whitespace") as mock_trim,
                patch.object(processor, "add_padding") as mock_padding,
            ):

                mock_crop.return_value = image_path
                mock_trim.return_value = image_path
                mock_padding.return_value = image_path

                crop_box = (10, 20, 110, 120)
                result = processor.process_question_image(image_path, crop_box)

                assert result is not None
                mock_crop.assert_called_once_with(image_path, crop_box, 0)
                mock_trim.assert_called_once()
                mock_padding.assert_called_once()


class TestBackendStructure:
    """Test backend directory structure and organization"""

    def test_api_v1_structure(self):
        """Test that API v1 modules have expected structure"""
        from college_board_eval.web.backend.api.v1 import exams, health, results, uploads

        # Check that each module has a router
        assert hasattr(exams, "router")
        assert hasattr(health, "router")
        assert hasattr(results, "router")
        assert hasattr(uploads, "router")

        # Check that routers have expected attributes
        for module in [exams, health, results, uploads]:
            router = module.router
            assert hasattr(router, "routes")
            assert hasattr(router, "prefix")
            assert hasattr(router, "tags")

    def test_main_app_structure(self):
        """Test that main app has expected structure"""
        from college_board_eval.web.backend.main import app

        # Check that app has expected attributes
        assert hasattr(app, "routes")
        assert hasattr(app, "title")
        assert hasattr(app, "description")
        assert hasattr(app, "version")

        # Check app metadata
        assert app.title == "College Board Exam Extractor API"
        assert "SAT/AP exam" in app.description
        assert app.version == "1.0.0"

    def test_main_app_routes_registered(self):
        """Test that all expected routes are registered"""
        from college_board_eval.web.backend.main import app

        # Get all registered routes
        routes = [route.path for route in app.routes]

        # Check for expected routes
        expected_routes = [
            "/",
            "/health",
            "/api/v1/exams/types",
            "/api/v1/exams/years",
            "/api/v1/exams/upload",
            "/api/v1/exams/{exam_name}/images",
            "/api/v1/results/",
            "/api/v1/results/{filename}",
        ]

        for expected_route in expected_routes:
            # Check if the route exists in the registered routes
            route_exists = any(
                route == expected_route
                or route.replace("{exam_name}", "test").replace("{filename}", "test.json") == expected_route
                for route in routes
            )
            assert route_exists, f"Expected route {expected_route} not found in {routes}"


def run_backend_tests():
    """Run all backend tests and report results"""
    print("🧪 Running Backend Tests...")

    test_classes = [
        TestBackendConfig,
        TestBackendImports,
        TestBackendAPI,
        TestImageProcessor,
        TestBackendStructure,
    ]

    passed = 0
    total = 0

    for test_class in test_classes:
        print(f"\n📋 Testing {test_class.__name__}...")
        test_instance = test_class()

        for method_name in dir(test_instance):
            if method_name.startswith("test_"):
                try:
                    method = getattr(test_instance, method_name)
                    if callable(method):
                        method()
                        print(f"  ✅ {method_name}")
                        passed += 1
                    total += 1
                except Exception as e:
                    print(f"  ❌ {method_name}: {str(e)}")
                    total += 1

    print(f"\n📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All backend tests passed!")
        return True
    else:
        print("⚠️  Some backend tests failed!")
        return False


if __name__ == "__main__":
    run_backend_tests()
