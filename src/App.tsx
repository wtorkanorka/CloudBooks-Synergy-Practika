import { useEffect, useState } from "react";
import "./App.css";
import type { IBook } from "./Types/types";
import axios from "axios";
import { CardComponent } from "./components/CardComponent";
import { useNavigate } from "react-router-dom";

// Тип для вариантов сортировки
type SortOption = "author" | "year" | "category" | "default";

function App() {
  const [data, setData] = useState<IBook[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const navigate = useNavigate();

  async function getListOfBooks() {
    try {
      const response = await axios.get("/books?short=false");
      setData(response.data);
      return response.data;
    } catch (e: any) {
      console.log(e);
      if (e.status == 401) {
        navigate("/login");
      }
    }
  }

  // Функция сортировки книг
  const getSortedBooks = () => {
    const books = [...data];

    switch (sortOption) {
      case "author":
        return books.sort((a, b) => {
          const authorA = `${a.author.last_name} ${a.author.first_name}`;
          const authorB = `${b.author.last_name} ${b.author.first_name}`;
          return authorA.localeCompare(authorB);
        });

      case "year":
        return books.sort((a, b) => {
          const yearA = new Date(a.createdAt).getFullYear();
          const yearB = new Date(b.createdAt).getFullYear();
          return yearB - yearA; // Сначала новые
        });

      case "category":
        return books.sort((a, b) => a.category.localeCompare(b.category));

      default:
        return books; // Без сортировки
    }
  };

  useEffect(() => {
    getListOfBooks();
  }, []);

  return (
    <div className="flex flex-col w-full gap-[20px] p-4">
      {/* Панель сортировки */}
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="sort" className="font-medium">
          Сортировка:
        </label>
        <select
          id="sort"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="default">По умолчанию</option>
          <option value="author">По автору (А-Я)</option>
          <option value="year">По году (сначала новые)</option>
          <option value="category">По категории</option>
        </select>
      </div>

      {/* Список книг */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getSortedBooks().map((book) => (
          <CardComponent book={book} key={book.id} />
        ))}
      </div>
    </div>
  );
}

export default App;
