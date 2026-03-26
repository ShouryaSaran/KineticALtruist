import {router} from "./app.routes";
import { RouterProvider } from "react-router-dom";

export default function App() {
  return(
    <RouterProvider router={router}/>
  )
}
