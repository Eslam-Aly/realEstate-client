import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { app } from "../firebase.js";
import { useDispatch } from "react-redux";
import { signInSuccess } from "../redux/user/userSlice.js";
import { useNavigate } from "react-router-dom";
import API from "../config/api.js";
import { t } from "i18next";
import { FcGoogle } from "react-icons/fc";

function OAuth() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential.idToken;

      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Google authentication failed");

      const data = await res.json();
      dispatch(signInSuccess(data));
      navigate("/");
    } catch (error) {
      console.log("could not sign in with Google", error);
    }
  };
  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      className="border p-3 rounded-lg w-full flex justify-center items-center gap-3 hover:shadow-md transition-shadow duration-150 ease-in-out cursor-pointer"
    >
      {t("auth.continueWithGoogle")} <FcGoogle className="size-8" />
    </button>
  );
}

export default OAuth;
