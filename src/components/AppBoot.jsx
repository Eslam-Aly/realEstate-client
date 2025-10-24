import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  hydrateFavorites,
  clearFavorites,
} from "../redux/user/favoritesSlice.js";

export default function AppBoot() {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((s) => s.user);

  useEffect(() => {
    if (currentUser) dispatch(hydrateFavorites());
    else dispatch(clearFavorites());
  }, [currentUser, dispatch]);

  return null;
}
