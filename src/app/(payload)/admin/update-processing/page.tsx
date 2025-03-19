"use client";

import { useState } from "react";
import {
  updateProcessingGames,
  updateProcessingAccessories,
  updateAllProcessingItems,
} from "@/lib/utils/updateProcessingItems";

export default function UpdateProcessingPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [limit, setLimit] = useState(10);

  // Get the base URL
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  };

  const handleUpdateGames = async () => {
    setLoading(true);
    try {
      const result = await updateProcessingGames(getBaseUrl(), limit);
      setResults(result);
    } catch (error) {
      console.error("Error updating games:", error);
      setResults({ error: "Failed to update games" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccessories = async () => {
    setLoading(true);
    try {
      const result = await updateProcessingAccessories(getBaseUrl(), limit);
      setResults(result);
    } catch (error) {
      console.error("Error updating accessories:", error);
      setResults({ error: "Failed to update accessories" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAll = async () => {
    setLoading(true);
    try {
      const result = await updateAllProcessingItems(getBaseUrl(), limit);
      setResults(result);
    } catch (error) {
      console.error("Error updating items:", error);
      setResults({ error: "Failed to update items" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Update Processing Items</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Items Per Collection Limit
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)}
            className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            min="1"
            max="50"
          />
        </label>
        <p className="text-sm text-gray-500 mt-1">
          Maximum number of items to process per collection
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={handleUpdateGames}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Games"}
        </button>

        <button
          onClick={handleUpdateAccessories}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Accessories"}
        </button>

        <button
          onClick={handleUpdateAll}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update All Items"}
        </button>
      </div>

      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>

          {results.error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{results.error}</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-md">
              <div className="px-4 py-5 sm:p-6">
                {results.games && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">Games Update</h3>
                    <p>{results.games.message}</p>
                    {results.games.results && (
                      <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(results.games.results, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {results.accessories && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">Accessories Update</h3>
                    <p>{results.accessories.message}</p>
                    {results.accessories.results && (
                      <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(results.accessories.results, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {!results.games && !results.accessories && (
                  <div>
                    <p>{results.message}</p>
                    <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(results.results, null, 2)}
                    </pre>
                  </div>
                )}

                {results.totalUpdated !== undefined && (
                  <p className="mt-4 font-semibold">
                    Total items updated: {results.totalUpdated}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
