import React from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth.jsx";
import API from "../config/api.js";

function SignUp() {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({});
  const navigate = useNavigate();
  const handleChange = async (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      }
      setLoading(false);
      setError(null);
      navigate("/signin");
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-16 p-6  rounded-lg shadow-lg">
      <h1 className="text-3xl text-center font-semibold my-7">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 ">
        <input
          onChange={handleChange}
          type="text"
          id="username"
          placeholder="username"
          className="border p-3 rounded-lg "
        />
        <input
          onChange={handleChange}
          type="email"
          id="email"
          placeholder="email"
          className="border p-3 rounded-lg "
        />
        <input
          onChange={handleChange}
          type="password"
          id="password"
          placeholder="password"
          className="border p-3 rounded-lg "
        />
        <button
          disabled={loading}
          type="submit"
          className="bg-blue-800 text-white p-3 rounded-lg font-semibold"
        >
          {loading ? "Loading..." : "Sign Up"}
        </button>
        <OAuth />
      </form>
      <div className="flex gap-2 mt-5">
        <p>Have an account?</p>
        <Link to="/signin" className="text-blue-800 font-semibold">
          {" "}
          Login
        </Link>
      </div>
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
export default SignUp;
