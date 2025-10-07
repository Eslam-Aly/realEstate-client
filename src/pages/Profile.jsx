import { useSelector } from "react-redux";
import { useRef } from "react";
import { FaCamera } from "react-icons/fa";

function Profile() {
  const fileRef = useRef(null);
  const currentUser = useSelector((state) => state.user.currentUser);
  return (
    <div>
      <h1 className="text-3xl text-center font-semibold my-7">Profile</h1>
      <form className="max-w-lg mx-auto mt-16 p-6 rounded-lg shadow-lg flex flex-col gap-5">
        <input type="file" ref={fileRef} hidden accept="image/*" />
        <div className="relative w-26 h-26 mx-auto">
          <img
            src={currentUser.avatar}
            alt="avatar"
            className=" rounded-full  object-cover"
          />
          <button
            className="absolute left-[60%] top-[60%] bg-gray-200 p-2 rounded-full cursor-pointer hover:bg-gray-300 transition"
            onClick={() => fileRef.current.click()}
          >
            <FaCamera />
          </button>
        </div>

        <input
          type="username"
          placeholder="username"
          className="border p-3 rounded-lg"
        />
        <input
          type="email"
          placeholder="email"
          className="border p-3 rounded-lg"
        />
        <input
          type="password"
          placeholder="password"
          className="border p-3 rounded-lg"
        />
        <button className="bg-blue-800 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer">
          Update Profile
        </button>
      </form>
      <div className="mt-4 flex justify-between max-w-lg mx-auto text-red-600">
        <button>Delete Account</button>
        <button>Sign Out</button>
      </div>
    </div>
  );
}

export default Profile;
