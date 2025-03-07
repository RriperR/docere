import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api.js";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants.js";
import { useState, useEffect } from "react";

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [token, setToken] = useState(localStorage.getItem(ACCESS_TOKEN)); // Отслеживаем токен

    useEffect(() => {
        const checkAuth = () => {
            const storedToken = localStorage.getItem(ACCESS_TOKEN);
            setToken(storedToken); // Обновляем токен в состоянии

            if (!storedToken) {
                console.warn("⚠️ Токен отсутствует, доступ запрещён.");
                setIsAuthorized(false);
                return;
            }

            try {
                const decoded = jwtDecode(storedToken);
                setIsAuthorized(decoded.exp > Date.now() / 1000);
                console.log("✅ Токен действителен, доступ разрешён.");
            } catch (error) {
                console.error("❌ Ошибка декодирования токена:", error);
                setIsAuthorized(false);
            }
        };

        checkAuth(); // Проверяем токен при загрузке компонента

        // Слушаем изменения `localStorage`
        window.addEventListener("storage", checkAuth);
        return () => window.removeEventListener("storage", checkAuth);
    }, [token]); // Добавили `token` в зависимости, чтобы компонент обновлялся

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
            console.warn("⚠️ Нет refresh-токена, выход!");
            setIsAuthorized(false);
            return;
        }

        try {
            console.log("🔄 Отправка запроса на /token/refresh");
            const res = await api.post("/token/refresh", { refresh: refreshToken });

            if (res.status === 200) {
                console.log("✅ Новый токен получен:", res.data.access);
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setToken(res.data.access); // Обновляем `token`, чтобы перерисовать компонент
                setIsAuthorized(true);
            } else {
                console.warn("⚠️ Сервер вернул ошибку, сбрасываем токены!");
                localStorage.removeItem(ACCESS_TOKEN);
                localStorage.removeItem(REFRESH_TOKEN);
                setToken(null);
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error("❌ Ошибка при обновлении токена:", error);
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            setToken(null);
            setIsAuthorized(false);
        }
    };

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
