import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './UploadImage.css';

export default function ImageUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  const REACT_APP_BASEURL = process.env.REACT_APP_BASEURL || 'http://127.0.0.1:5000';

  const storedUserData = JSON.parse(localStorage.getItem('user'));
  const username = storedUserData ? storedUserData.username : null;
  const userRole = storedUserData ? storedUserData.role : null;

  useEffect(() => {
    if (redirecting) {
      const timer = setTimeout(() => {
        if (userRole === 'sponsor') {
          navigate('/sponsor/profile');
        } else if (userRole === 'admin') {
          navigate('/admin/profile');
        } else {
          navigate('/user/profile');
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [redirecting, navigate, userRole]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setMessage(""); // Clear previous error messages
    } else {
      setFile(null);
      setMessage("Invalid file type. Please select an image.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select an image file first.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Selected file is not an image.");
      return;
    }

    if (!username) {
      setMessage("You are not logged in.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("username", username);

    try {
      setUploading(true);
      setMessage("");
      await axios.post(REACT_APP_BASEURL + '/user/upload/pfp', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRedirecting(true);
      setMessage("Upload successful! Redirecting to profile...");
    } catch (error) {
      setMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (userRole === 'sponsor') {
      navigate('/sponsor/profile');
    } else if (userRole === 'admin') {
      navigate('/admin/profile');
    } else {
      navigate('/user/profile');
    }
  };

  return (
    <div className="image-upload-container">
      <h2 className="upload-heading">Upload Profile Picture</h2>
      <input type="file" onChange={handleFileChange} />
      <div className="button-container">
        <button
          onClick={handleUpload}
          disabled={uploading || redirecting}
          className="upload-image-button"
        >
          {uploading ? "Uploading..." : redirecting ? "Redirecting..." : "Upload"}
        </button>
        <button
          onClick={handleCancel}
          disabled={uploading || redirecting}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
      {message && <p className={redirecting ? "redirect-message" : "message"}>{message}</p>}
    </div>
  );
}