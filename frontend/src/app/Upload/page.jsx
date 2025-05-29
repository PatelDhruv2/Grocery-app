"use client";
import React, { useState } from "react";

const categories = [
  "FRUITS_VEGETABLES",
  "DAIRY_BAKERY",
  "SNACKS_BRANDED_FOODS",
  "BEVERAGES",
  "PERSONAL_CARE",
  "HOUSEHOLD_SUPPLIES",
  "MEAT_SEAFOOD",
  "GOURMET_WORLD_FOOD",
  "BABY_CARE",
  "CLEANING_HOUSEHOLD",
  "STAPLES",
  "PET_CARE",
];

const FileUploader = () => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    category: "",
  });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setStatus("❌ Please select a file.");
      return;
    }
    if (!formData.name || !formData.price || !formData.category || !formData.stock) {
      setStatus("❌ Please fill in all required fields.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("productFile", file);
    uploadData.append("name", formData.name);
    uploadData.append("price", formData.price);
    uploadData.append("stock", formData.stock);
    uploadData.append("category", formData.category);
    if (formData.description) uploadData.append("description", formData.description);

    try {
      const response = await fetch("http://localhost:5000/upload-product", {
        method: "POST",
        body: uploadData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("✅ Upload successful!");
        console.log(result);
        setFormData({
          name: "",
          price: "",
          stock: "",
          description: "",
          category: "",
        });
        setFile(null);
        event.target.reset();
      } else {
        setStatus(`❌ Upload failed: ${result.error || JSON.stringify(result)}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">Upload Product</h2>
      <form onSubmit={handleFileUpload}>
        <input
          type="text"
          name="name"
          placeholder="Product Name*"
          value={formData.name}
          onChange={handleInputChange}
          className="mb-2 block w-full border px-2 py-1 rounded"
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price*"
          step="0.01"
          value={formData.price}
          onChange={handleInputChange}
          className="mb-2 block w-full border px-2 py-1 rounded"
          required
        />
        <input
          type="number"
          name="stock"
          placeholder="Stock*"
          value={formData.stock}
          onChange={handleInputChange}
          className="mb-2 block w-full border px-2 py-1 rounded"
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleInputChange}
          className="mb-2 block w-full border px-2 py-1 rounded"
        />
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="mb-2 block w-full border px-2 py-1 rounded"
          required
        >
          <option value="" disabled>
            Select Category*
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          type="file"
          name="productFile"
          onChange={handleFileChange}
          className="mb-2 block"
          required
          accept="image/*"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Upload
        </button>
      </form>
      <p className="mt-4 text-sm">{status}</p>
    </div>
  );
};

export default FileUploader;
