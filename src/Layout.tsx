import axios from "axios";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { IBook } from "./Types/types";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const isAdminLC =
    JSON.parse(localStorage.getItem("isAdmin") ?? "{}")?.is_admin ?? "";
  console.log("isAdminLC", isAdminLC);

  const [logoutData, setLogoutData] = useState<any>(null);

  const navigate = useNavigate();
  async function logout() {
    try {
      const data = await axios.post("/logout");

      setLogoutData(data);
      console.log(data, "LOGOUT DATA");
      localStorage.setItem("isAdmin", JSON.stringify(null));
      localStorage.setItem("yourMeta", JSON.stringify(null));
    } catch (e) {
      console.log(e);
    }
  }
  useEffect(() => {
    if (logoutData?.data?.message == "Logged out successfully") {
      navigate("/login");
    }
  }, [logoutData]);

  async function getBooksArendedByMe() {
    try {
      const data = await axios.get(`/arendedBooks`);

      const arr = data.data.map((elem: IBook) => {
        return {
          is_rented_end: elem?.status?.isRentedBy?.is_rented_end,
          title: elem.title,
        };
      });
      arr.map((elem: { is_rented_end: string; title: string }) => {
        alert(
          `Срок аренды книги ${elem.title}, кончается ${elem.is_rented_end}`
        );
      });
    } catch (e: any) {
      if (e.status == 401) {
        navigate("/login");
      }
      console.log(e);
    }
  }
  useEffect(() => {
    getBooksArendedByMe();
  }, []);
  return (
    <main className="min-h-[100vh] w-full p-[20px] transition-all duration-1000 bg-[#004586] bg-gradient-to-l from-blue-400 to-purple-500">
      <header className="w-[calc(100%+40px)] translate-x-[-20px] translate-y-[-20px] bg-[white]">
        {isAdminLC && (
          <>
            {location.pathname !== "/login" &&
              location.pathname !== "/register" && (
                <>
                  {location.pathname !== "/adminPanel" ? (
                    <Link
                      to="/adminPanel"
                      className="p-[20px] flex items-center justify-center"
                    >
                      Перейти в панель админа
                    </Link>
                  ) : (
                    <Link
                      to="/"
                      className="p-[20px] flex items-center justify-center"
                    >
                      Вернуться на главную страницу
                    </Link>
                  )}
                </>
              )}
          </>
        )}
        <nav>
          <ul className="flex w-full items-center gap-[20px]">
            <li>
              {location.pathname !== "/login" &&
                location.pathname !== "/register" && (
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="p-[20px] bg-white flex items-center justify-center"
                  >
                    Выйти из аккаунта
                  </button>
                )}
            </li>

            {location.pathname !== "/login" &&
              location.pathname !== "/register" && (
                <li>
                  <Link to="/" className="">
                    Главная страница
                  </Link>
                </li>
              )}
            {location.pathname !== "/login" &&
              location.pathname !== "/register" && (
                <li>
                  <Link to="/favouritesBooks">Моя библиотека</Link>
                </li>
              )}
          </ul>
        </nav>
      </header>

      {children}
    </main>
  );
}
