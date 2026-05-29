import { Outlet, Route, Routes } from "react-router";
import Profile from "../profile/profile";
import Dashboard from "../dashboard/dashboard";
import Request from "../appointements/appointements";
import Nav from "../navigation/nav";
import styles from "./mainpage.module.css";

export default function MainPage() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}
