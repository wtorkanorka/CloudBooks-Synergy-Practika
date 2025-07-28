"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import type { IBook } from "../Types/types";
import { FavouriteBookContainer } from "../components/FavouriteBookContainer";
import { useNavigate } from "react-router-dom";

export const FavouritesBooksPage = () => {
  const [data, setData] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function getMyFavouritesBooks() {
    try {
      setLoading(true);
      const data: { data: { books: IBook[] } } = await axios.get(
        "/favouriteBooks"
      );
      setData(data.data.books);
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
    getMyFavouritesBooks();
  }, []);

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 ${
        loading && "opacity-60"
      }`}
    >
      {data.map((book, index) => (
        <FavouriteBookContainer
          book={book}
          data={data}
          setData={setData}
          key={index}
        />
      ))}
    </div>
  );
};
