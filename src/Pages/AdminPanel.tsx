"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDebounce } from "../functions/functions";
import type { IBook } from "../Types/types";

export const AdminPanel = () => {
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState<IBook | null>(null);
  const [editData, setEditData] = useState<IBook | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  const isAdmin = JSON.parse(localStorage.getItem("isAdmin") ?? "{}") ?? "";

  useEffect(() => {
    if (!isAdmin.is_admin) {
      navigate("/");
    }
  }, [isAdmin.is_admin]);

  async function getBook() {
    try {
      setLoading(true);
      const data = await axios.get(`/getBookByTitle/${inputText}`);
      console.log(data, "AAAAAAAA");
      if (data.data.length == 0) {
        setBookData(null);
        setEditData(null);
      } else {
        setBookData(data.data);
        setEditData(data.data); // Инициализируем данные для редактирования
      }

      return data;
    } catch (e: any) {
      if (e.status == 401) {
        navigate("/login");
      }
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  const debouncedHandleChange = useDebounce(() => {
    if (inputText !== "") {
      getBook();
    }
  }, 500);

  useEffect(() => {
    debouncedHandleChange();
  }, [inputText]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setEditData((prev) => {
      if (!prev) return null;

      if (name.startsWith("status.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          status: {
            ...prev.status,
            [field]:
              field === "isBought" || field === "isRented"
                ? value === "true"
                : value || null, // Для isBoughtBy и isRentedBy
          },
        };
      } else if (name === "genre") {
        return {
          ...prev,
          genre: value.split(",").map((item) => item.trim()),
        };
      } else {
        return {
          ...prev,
          [name]: name === "cost" ? parseFloat(value) : value,
        };
      }
    });
  };

  const handleSave = async () => {
    if (!editData) return;

    try {
      setIsSaving(true);
      const response = await axios.put(`/updateBook/${bookData?.id}`, editData);
      setBookData(
        Array.isArray(response.data) ? response.data[0] : response.data
      );
      setIsEdit(false);
      alert("Книга успешно обновлена!");
    } catch (error: any) {
      console.error("Ошибка при обновлении книги:", error);
      if (error.status == 401) {
        navigate("/login");
      }
      alert(`Произошла ошибка при обновлении книги \n ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  async function deleteBook() {
    try {
      if (!bookData?.id) return;
      const data = await axios.delete(`/books/${bookData?.id}`);

      alert(data.data.message);
      setBookData(null);
      setEditData(null);
      return data;
    } catch (e: any) {
      console.log(e);
      if (e.status == 401) {
        navigate("/login");
      }
      alert(`Возникла ошибка при удалении \n ${e}`);
    }
  }
  return (
    <div className="container mx-auto p-4">
      <input
        type="text"
        placeholder="Введите точное название книги"
        onChange={(e) => setInputText(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      {bookData == null && <p>Такой книги нет</p>}
      {!loading && bookData && bookData !== null && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {isEdit ? (
                  <input
                    type="text"
                    name="title"
                    value={editData?.title || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <Link to={`/BookContentPage/${bookData?.id}`}>
                    {bookData.title}
                  </Link>
                )}
              </h3>
              <button
                onClick={() => {
                  if (isEdit) {
                    handleSave();
                  } else {
                    setIsEdit(true);
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={isSaving}
              >
                {isSaving
                  ? "Сохранение..."
                  : isEdit
                  ? "Сохранить"
                  : "Редактировать"}
              </button>
              {isEdit && (
                <button onClick={() => setIsEdit((prev) => !prev)}>
                  Редактировать
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-1">Автор:</label>
                {isEdit ? (
                  <div className="grid grid-cols-2 gap-2">
                    <p>{editData?.author.first_name}</p>
                    <p>{editData?.author.last_name}</p>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {bookData?.author?.first_name} {bookData?.author?.last_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Категория:</label>
                {isEdit ? (
                  <input
                    type="text"
                    name="category"
                    value={editData?.category || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {bookData.category}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  Жанры (через запятую):
                </label>
                {isEdit ? (
                  <input
                    type="text"
                    name="genre"
                    value={editData?.genre?.join(", ") || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {bookData?.genre?.map((genr, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                      >
                        {genr}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Описание:</label>
                {isEdit ? (
                  <textarea
                    name="description"
                    value={editData?.description || ""}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 text-sm">
                    {bookData?.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">Цена:</label>
                  {isEdit ? (
                    <input
                      type="number"
                      name="cost"
                      value={editData?.cost || 0}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded"
                      step="0.01"
                    />
                  ) : (
                    <p>${bookData?.cost?.toFixed(2)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Статус:</label>
                  {isEdit ? (
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="status.isBought"
                          disabled={!bookData.status.isBought}
                          checked={!!editData?.status.isBought}
                          onChange={(e) =>
                            handleEditChange({
                              target: {
                                name: "status.isBought",
                                value: e.target.checked.toString(),
                              },
                            } as React.ChangeEvent<HTMLInputElement>)
                          }
                          className="mr-2"
                        />
                        Куплено
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          disabled={!bookData.status.isRented}
                          name="status.isRented"
                          checked={!!editData?.status.isRented}
                          onChange={(e) =>
                            handleEditChange({
                              target: {
                                name: "status.isRented",
                                value: e.target.checked.toString(),
                              },
                            } as React.ChangeEvent<HTMLInputElement>)
                          }
                          className="mr-2"
                        />
                        Арендовано
                      </label>
                    </div>
                  ) : (
                    <div>
                      <p>Куплено: {String(bookData?.status?.isBought)}</p>
                      <p>
                        Покупатель:{" "}
                        {bookData?.status?.isBoughtBy?.user?.first_name || "-"}{" "}
                        {bookData?.status?.isBoughtBy?.user?.last_name || "-"}
                      </p>
                      <p>Арендовано: {String(bookData?.status?.isRented)}</p>
                      <p>
                        Арендодатель:{" "}
                        {bookData?.status?.isRentedBy?.user?.first_name || "-"}{" "}
                        {bookData?.status?.isRentedBy?.user?.last_name || "-"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
            <div>
              <span className="text-gray-500 text-sm">Добавлено:</span>
              <span className="text-gray-700 ml-1 text-sm">
                {new Date(bookData?.createdAt)?.toLocaleDateString()}
              </span>
            </div>
            {!isEdit && (
              <span className="text-lg font-bold text-indigo-600">
                ${bookData?.cost?.toFixed(2)}
              </span>
            )}
            <button
              onClick={() => {
                deleteBook();
              }}
              className="text-red-600 font-medium text-2xl"
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
