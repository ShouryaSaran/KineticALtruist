import { createBrowserRouter, Navigate } from "react-router-dom";
import Landing from "./Features/Home/Pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Scores from "./pages/Scores";
import Charity from "./pages/Charity";
import Draws from "./pages/Draws";
import Winnings from "./pages/Winnings";
import Subscribe from "./pages/Subscribe";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminDraws from "./pages/AdminDraws";
import AdminCharities from "./pages/AdminCharities";
import AdminWinners from "./pages/AdminWinners";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Landing />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/signup",
        element: <Signup />,
    },
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: "/scores",
        element: (
            <ProtectedRoute>
                <Scores />
            </ProtectedRoute>
        ),
    },
    {
        path: "/charity",
        element: (
            <ProtectedRoute>
                <Charity />
            </ProtectedRoute>
        ),
    },
    {
        path: "/draws",
        element: (
            <ProtectedRoute>
                <Draws />
            </ProtectedRoute>
        ),
    },
    {
        path: "/winnings",
        element: (
            <ProtectedRoute>
                <Winnings />
            </ProtectedRoute>
        ),
    },
    {
        path: "/subscribe",
        element: (
            <ProtectedRoute>
                <Subscribe />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admin",
        element: (
            <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admin/dashboard",
        element: <Navigate to="/admin" replace />,
    },
    {
        path: "/admin/users",
        element: (
            <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admin/draws",
        element: (
            <ProtectedRoute requireAdmin={true}>
                <AdminDraws />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admin/charities",
        element: (
            <ProtectedRoute requireAdmin={true}>
                <AdminCharities />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admin/winners",
        element: (
            <ProtectedRoute requireAdmin={true}>
                <AdminWinners />
            </ProtectedRoute>
        ),
    },
]);
