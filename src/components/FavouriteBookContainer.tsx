import { useState } from "react";
import type { IBook } from "../Types/types";
import axios from "axios";
import { Link } from "react-router-dom";

export const FavouriteBookContainer = ({
  book,

  setData,
}: {
  book: IBook;
  data: IBook[];
  setData: any;
}) => {
  const [loading, setLoading] = useState(false);

  async function setToFavourite(book: any) {
    try {
      setLoading(true);
      const data = await axios.post(`/favouriteBooks`, {
        book,
      });

      setData(
        data && data.data && data.data.data[0] && data.data.data[0].books_id
          ? data?.data.data[0].books_id
          : []
      );
      return data;
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      key={book.id}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      {/* Бейдж категории */}
      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
        {book.category}
      </div>

      {/* Обложка книги (заглушка) */}
      <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
        <h3 className="text-white text-xl font-bold">{book.title.charAt(0)}</h3>
      </div>

      {/* Контент карточки */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link
            to={`/BookContentPage/${book.id}`}
            className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-400"
          >
            {book.title}
          </Link>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
            ${book.cost}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
          {book.description}
        </p>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <span>
            {book.author.first_name} {book.author.last_name}
          </span>
          <span className="mx-2">•</span>
          <span>{new Date(book.createdAt).toLocaleDateString()}</span>
        </div>
        {/* Жанры */}
        <div className="flex flex-wrap gap-2 mb-4">
          {book.genre.map((g) => (
            <span
              key={g}
              className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded"
            >
              {g}
            </span>
          ))}
        </div>
        {/* Статус */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            {book.status.isBought && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Куплена
              </span>
            )}
            {book.status.isRented && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Арендовано
              </span>
            )}
          </div>
          <button
            disabled={loading}
            onClick={() => {
              setToFavourite(book);
            }}
            className="hover:text-red-600"
          >
            Удалить из избранного
          </button>
        </div>
      </div>
    </div>
  );
};
