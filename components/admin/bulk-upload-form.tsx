"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UploadResult = {
  success: boolean;
  category: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
};

type UploadResponse = {
  success: boolean;
  results: UploadResult[];
  summary: {
    totalCategories: number;
    totalRows: number;
    totalSuccess: number;
    totalErrors: number;
  };
};

export function BulkUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx")) {
        setError("Please select an Excel file (.xlsx)");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setUploadResponse(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadResponse(data);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/Guide_Validator_Bulk_Upload_Template.xlsx";
    link.download = "Guide_Validator_Bulk_Upload_Template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Template Download Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-3">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">
              Download Template First
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Download the Excel template, fill it with your data, and then upload it here.
              The template includes detailed instructions and examples for each category.
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Completed Template
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Excel File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span> (
                  {(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-red-600 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing Upload...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload and Process
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {uploadResponse && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700 font-medium">Categories</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {uploadResponse.summary.totalCategories}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-700 font-medium">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {uploadResponse.summary.totalRows}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-700 font-medium">Success</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {uploadResponse.summary.totalSuccess}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700 font-medium">Errors</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {uploadResponse.summary.totalErrors}
                </p>
              </div>
            </div>
          </div>

          {/* Category Results */}
          {uploadResponse.results.map((result) => (
            <div
              key={result.category}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {result.category}
                </h4>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    result.success
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {result.success ? (
                    <>
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      All Success
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Partial Success
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {result.totalRows}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success</p>
                  <p className="text-lg font-semibold text-green-600">
                    {result.successCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-lg font-semibold text-red-600">
                    {result.errorCount}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">
                    Errors ({result.errors.length})
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg bg-red-50 p-3 text-sm"
                      >
                        <p className="font-medium text-red-900">
                          Row {err.row}: {err.email}
                        </p>
                        <p className="text-red-700 mt-1">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
