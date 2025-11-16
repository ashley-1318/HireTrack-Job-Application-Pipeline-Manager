import React, { useEffect, useState } from "react";
import axios from "axios";

const statusColor = {
  Screening: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Applied: "bg-gray-100 text-gray-700",
};

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get("/api/admin/candidates");
      setCandidates(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const openModal = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const closeModal = () => {
    setSelectedCandidate(null);
  };

  const overrideDecision = async (id, decision) => {
    try {
      await axios.patch(`/api/admin/candidates/${id}/override`, {
        decision,
        reason: "Manual override",
      });
      await fetchCandidates();
      alert("Candidate decision updated!");
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to update candidate");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6">Candidate Screening Overview</h1>

      {/* Candidate Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left text-sm font-semibold">Name</th>
              <th className="p-3 text-left text-sm font-semibold">Job Role</th>
              <th className="p-3 text-left text-sm font-semibold">ATS Score</th>
              <th className="p-3 text-left text-sm font-semibold">Decision</th>
              <th className="p-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c._id || c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.job?.title || "N/A"}</td>
                <td className="p-3 font-semibold">{c.ats?.totalScore ?? "—"}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      statusColor[c.ats?.decision] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.ats?.decision || "Not Evaluated"}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => openModal(c)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-xl font-bold">
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {selectedCandidate.name}'s ATS Result
            </h2>

            <div className="space-y-2">
              <p><b>Email:</b> {selectedCandidate.email}</p>
              <p><b>Phone:</b> {selectedCandidate.phone}</p>
              <p>
                <b>Resume:</b>{" "}
                <a
                  href={selectedCandidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  View Resume
                </a>
              </p>

              <p><b>ATS Score:</b> {selectedCandidate.ats?.totalScore}</p>

              <p>
                <b>Decision:</b>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    statusColor[selectedCandidate.ats?.decision] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {selectedCandidate.ats?.decision || "Not Evaluated"}
                </span>
              </p>

              <div className="bg-gray-50 p-3 rounded border text-sm">
                <b>Explanation:</b>
                <p>{selectedCandidate.ats?.explanation}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded border text-sm">
                <b>Breakdown:</b>
                <ul className="list-disc ml-5">
                  <li>Skill Match: {selectedCandidate.ats?.breakdown?.skill_match}%</li>
                  <li>Experience Match: {selectedCandidate.ats?.breakdown?.experience_match}%</li>
                  <li>Education Match: {selectedCandidate.ats?.breakdown?.education_match}%</li>
                  <li>Keyword Match: {selectedCandidate.ats?.breakdown?.keyword_match}%</li>
                </ul>
              </div>
            </div>

            {/* Override Buttons */}
            <div className="flex gap-4 mt-5">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => overrideDecision(selectedCandidate._id || selectedCandidate.id, "Screening")}
              >
                Mark as Screening
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => overrideDecision(selectedCandidate._id || selectedCandidate.id, "Rejected")}
              >
                Mark as Rejected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
