import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";


function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await api.post(route, { username, password });

            if (method === "login") {
                console.log("🔥 Токены перед сохранением:", res.data);

                if (res.data.access && res.data.refresh) {
                    localStorage.setItem("access_token", res.data.access);
                    localStorage.setItem("refresh_token", res.data.refresh);

                    console.log("🔍 Проверка localStorage сразу после setItem:");
                    console.log("📌 access_token:", localStorage.getItem("access_token"));
                    console.log("📌 refresh_token:", localStorage.getItem("refresh_token"));

                    window.dispatchEvent(new Event("storage")); // Сообщаем другим компонентам
                    window.location.href = "/";
                }
                 else {
                    console.error("❌ Ошибка: Токены не пришли в ответе сервера!");
                }
            } else {
                window.location.href = "/login";
            }
        } catch (error) {
            console.error("Ошибка авторизации:", error);
            alert("Ошибка входа! Проверьте логин и пароль.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>
            <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            {loading && <LoadingIndicator />}
            <button className="form-button" type="submit">
                {name}
            </button>
        </form>
    );
}

export default Form