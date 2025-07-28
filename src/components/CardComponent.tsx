import { useEffect, useState } from "react";
import type { IBook } from "../Types/types";
import axios from "axios";
import { Link } from "react-router-dom";

export const CardComponent = ({ book }: { book: IBook }) => {
  const [isFavorite, setIsFavourite] = useState(false);
  const [updatedData] = useState(book);
  const [loading, setLoading] = useState(false);
  async function setToFavourite(book: any) {
    try {
      const data = await axios.post(`/favouriteBooks/`, {
        book,
      });

      checkIsFavourite();
      return data;
    } catch (e) {
      console.log(e);
    }
  }

  async function checkIsFavourite() {
    setLoading(true);
    try {
      const data = await axios.get(`/favouriteBooks/${updatedData.id}`);

      setIsFavourite(data.data.isFavorite);
      return data;
    } catch (e: any) {
      setIsFavourite(e.response.data.isFavorite);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    checkIsFavourite();
  }, []);
  return (
    <div
      key={updatedData.id}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100"
    >
      {/* Верхняя часть с основными данными */}
      <div className="p-4">
        <button
          className={`${loading && "opacity-60"}`}
          disabled={loading}
          onClick={() => setToFavourite(updatedData)}
        >
          {isFavorite ? (
            <img
              src="/icons/heart.png"
              alt="heart"
              className="w-[30px] h-[30px]"
              title="Добавить в избранное"
            />
          ) : (
            <img
              src="/icons/heart-empty.png"
              alt="heart"
              className="w-[30px] h-[30px]"
              title="Добавить в избранное"
            />
          )}
        </button>
        <Link
          to={`/BookContentPage/${book.id}`}
          className="text-xl font-bold text-gray-800 mb-1 line-clamp-1 hover:text-blue-400"
        >
          {updatedData.title}
        </Link>
        <p className="text-gray-600 mb-2 ">
          {updatedData.author.first_name} {updatedData.author.last_name}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {updatedData.category}
          </span>
          {updatedData.genre.map((genr, index) => (
            <span
              key={index}
              className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
            >
              {genr}
            </span>
          ))}
        </div>

        <p className="text-gray-700 text-sm line-clamp-2 mb-3">
          {updatedData.description}
        </p>
        <div className="mt-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              updatedData.status.isBought
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {updatedData.status.isBought ? "Куплена" : "Доступна для покупки"}
          </span>
          {updatedData.status.isRented && (
            <span className="inline-block ml-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
              Арендовано
            </span>
          )}
        </div>
      </div>
      {/* Нижняя часть с ценой и датой */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <div>
          <span className="text-gray-500 text-sm">Added:</span>
          <span className="text-gray-700 ml-1 text-sm">
            {new Date(updatedData.createdAt).toLocaleDateString()}
          </span>
        </div>
        <span className="text-lg font-bold text-indigo-600">
          ${updatedData.cost.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
