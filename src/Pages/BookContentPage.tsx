"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { IBook } from "../Types/types";

export const BookContentPage = () => {
  const { id } = useParams<string>();
  const [data, setData] = useState<IBook | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const yourMetaData =
    JSON.parse(localStorage.getItem("yourMeta") ?? "{}")?.data?.user ?? "";

  const [isFavorite, setIsFavorite] = useState(false);
  const BOOK_PAGE_CHARS = 1500;
  const pages = useMemo(() => {
    if (!data) return [];
    const result = [];
    let start = 0;

    while (start < data.content.length) {
      // Находим ближайший пробел после BOOK_PAGE_CHARS символов
      let end = Math.min(start + BOOK_PAGE_CHARS, data.content.length);
      if (end < data.content.length) {
        // Ищем последний пробел, чтобы не разрывать слова
        const lastSpace = data.content.lastIndexOf(" ", end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }

      result.push(data.content.slice(start, end).trim());
      start = end;
    }

    return result;
  }, [data?.content]);
  const [flipAnimation, setFlipAnimation] = useState(false);

  const navigate = useNavigate();

  async function getBookById() {
    try {
      setLoading(true);
      const data = await axios.get(`/bookById/${id}`);
      console.log(data);
      setData(data.data);
      return data;
    } catch (e: any) {
      console.log(e);
      if (e.status == 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    getBookById();
  }, []);

  // const handleNextPage = () => {
  //   if (currentPage < pages.length - 1) {
  //     setFlipAnimation(true);
  //     setTimeout(() => {
  //       setCurrentPage((prev) => prev + 1);
  //       setFlipAnimation(false);
  //     }, 300);
  //   }
  // };

  // const handlePrevPage = () => {
  //   if (currentPage > 0) {
  //     setFlipAnimation(true);
  //     setTimeout(() => {
  //       setCurrentPage((prev) => prev - 1);
  //       setFlipAnimation(false);
  //     }, 300);
  //   }
  // };
  async function setToFavorite(book: any) {
    try {
      const data = await axios.post(`/favouriteBooks/`, {
        book,
      });

      checkIsFavorite();
      return data;
    } catch (e) {
      console.log(e);
    }
  }

  async function checkIsFavorite() {
    setLoading(true);
    try {
      if (!data) return;
      const dataFavourite = await axios.get(`/favouriteBooks/${data.id}`);

      setIsFavorite(dataFavourite.data.isFavorite);
      return data;
    } catch (e: any) {
      setIsFavorite(e.response.data.isFavorite);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    checkIsFavorite();
  }, [data]);

  const navigationTimer = useRef<NodeJS.Timeout | null>(null);

  const handleNavigation = (direction: "next" | "prev") => {
    if (isNavigating) return;

    setIsNavigating(true);
    setFlipAnimation(true);

    // Очищаем предыдущий таймер, если он есть
    if (navigationTimer.current) {
      clearTimeout(navigationTimer.current);
    }

    setTimeout(() => {
      if (direction === "next" && currentPage < pages.length - 1) {
        setCurrentPage((prev) => prev + 1);
      } else if (direction === "prev" && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      }

      setFlipAnimation(false);

      // Устанавливаем таймер для сброса блокировки через 500ms
      navigationTimer.current = setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }, 300); // Время анимации
  };
  const handleNextPage = () => handleNavigation("next");
  const handlePrevPage = () => handleNavigation("prev");

  useEffect(() => {
    return () => {
      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current);
      }
    };
  }, []);

  async function buyBook() {
    try {
      const dataBuyBook = await axios.put(`/updateBook/${data?.id}`, {
        ...data,
        status: {
          ...data?.status,
          isBought: true,
          isBoughtBy: {
            user: {
              user_id: yourMetaData.id,
              first_name: yourMetaData.user_metadata.first_name,
              last_name: yourMetaData.user_metadata.last_name,
            },
            isBoughtAt: new Date().toISOString(),
          },
        },
      });
      location.reload();
      return dataBuyBook;
    } catch (e) {
      console.log(e);
    }
  }

  async function rendBook(endDay: string) {
    try {
      const dataBuyBook = await axios.put(`/updateBook/${data?.id}`, {
        ...data,
        status: {
          ...data?.status,
          isRented: true,
          isRentedBy: {
            user: {
              user_id: yourMetaData.id,
              first_name: yourMetaData.user_metadata.first_name,
              last_name: yourMetaData.user_metadata.last_name,
            },
            is_rented_at: new Date().toISOString(),
            is_rented_end: endDay,
          },
        },
      });
      location.reload();
      return dataBuyBook;
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      {!isLoading && data !== null && data !== undefined && (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {!isReading ? (
            // Блок с информацией о книге
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="md:flex">
                {/* Обложка книги */}
                <div className="md:w-1/3 p-6 flex justify-center bg-white">
                  <div className="w-64 h-80 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg shadow-md flex items-center justify-center">
                    <span className="text-4xl font-bold text-blue-800 opacity-70">
                      {data.title.charAt(0)}
                    </span>
                  </div>
                </div>

                {/* Информация о книге */}
                <div className="md:w-2/3 p-6 md:p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-2">
                        {data?.category}
                      </span>
                      <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {data?.title}
                      </h1>
                      <p className="text-xl text-gray-600 mb-4">
                        {data?.author.first_name} {data?.author.last_name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setToFavorite(data);
                      }}
                      className={`p-2 rounded-full ${
                        isFavorite ? "text-red-500" : "text-gray-400"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill={isFavorite ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.genre.map((genre, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  <p className="text-gray-700 mb-6">{data.description}</p>

                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Добавлено:{" "}
                        {new Date(data.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            data.status.isBought
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {data.status.isBought
                            ? "Куплена"
                            : "Доступна для покупки"}
                        </span>
                        {data.status.isRented && (
                          <span className="inline-block ml-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                            Арендовано
                          </span>
                        )}
                      </div>
                      <div className="flex gap-[10px] items-baseline mt-[10px]">
                        {!data.status.isBought && (
                          <button
                            onClick={() => {
                              buyBook();
                            }}
                          >
                            Купить
                          </button>
                        )}
                        {!data.status.isBought && !data.status.isRented && (
                          <div className="rent-options">
                            <select
                              onChange={(e) => {
                                const days = parseInt(e.target.value);
                                const rentEndDate = new Date();
                                rentEndDate.setDate(
                                  rentEndDate.getDate() + days
                                );
                                rendBook(rentEndDate.toISOString());
                              }}
                              className="rent-select"
                            >
                              <option value="">Выберите срок аренды</option>
                              <option value="14">Арендовать на 2 недели</option>
                              <option value="30">Арендовать на 1 месяц</option>
                              <option value="90">Арендовать на 3 месяца</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-indigo-600 mr-4">
                        ${data.cost.toFixed(2)}
                      </span>
                      <button
                        onClick={() => setIsReading(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-300 flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        Читать
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Режим чтения книги
            <div className="bg-gray-50 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 bg-white border-b flex justify-between items-center">
                <button
                  onClick={() => setIsReading(false)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Назад к книге
                </button>
                <div className="text-sm text-gray-500">
                  Страница {currentPage + 1} из {pages.length}
                </div>
              </div>

              <div className="p-6 md:p-10 min-h-[70vh] flex flex-col">
                <div
                  className={`flex-1 bg-white p-8 rounded-lg shadow-md transition-all duration-300 ${
                    flipAnimation ? "transform rotate-y-180" : ""
                  }`}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {data.title}
                  </h2>
                  <div className="prose max-w-none text-gray-700">
                    {pages[currentPage].split("\n").map((paragraph, i) => (
                      <p key={i} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0 || isNavigating}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      currentPage === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Назад
                  </button>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === pages.length - 1 || isNavigating}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      currentPage === pages.length - 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    Вперед
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
