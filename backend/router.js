import { createClient } from "@supabase/supabase-js";
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";

const router = new Router();

const supabase = createClient(
  process.env.SUPABASE_URL || "https://bkpoehpfhwendzbcmzuf.supabase.co",

  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcG9laHBmaHdlbmR6YmNtenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTg4MjEsImV4cCI6MjA2NTczNDgyMX0.nViaDaNuPGOVlUqSKBUTzMaBFBcjj97Ik8I_5cmaB1c"
);

router.get("/isAdmin/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", id)
    .single();
  if (error) {
    console.log(error);
    return res.status(404).json(error);
  }
  console.log(data);
  return res.status(200).json(data);
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // 1. Регистрация пользователя в Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // Метаданные пользователя
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) throw authError;

    if (authData.confirmation_sent_at !== "")
      res.status(500).json({
        error:
          "На почту было отправлено письмо, после подтверждения следует перейти на страницу логина",
      });

    if (authData.user.email_confirmed_at !== "") {
      const { data: dataAdmintable, error: errorAdmintable } = await supabase
        .from("admins")
        .insert([{ user_id: authData.user.id, is_admin: false }]);

      if (errorAdmintable) throw errorAdmintable;
    }

    res.status(200).json(authData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// Вход
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.status(200).json(data);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// Получение текущей сессии
router.get("/session", async (req, res) => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Выход
router.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    res.status(200).json({ message: "Logged out successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Защищенные маршруты (пример)
router.get("/protected", async (req, res) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    res.status(200).json({ message: "Protected data", user: session.user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/books", async (req, res) => {
  try {
    // Правильное приведение типа
    const short = req.query.short === "true"; // будет true только если short=true

    const selectedColumns = short
      ? "id, category, author, createdAt, title, description, genre, cost, status"
      : "*";

    const { data, error } = await supabase
      .from("Books")
      .select(selectedColumns)
      .range(0, 9);

    if (error) {
      return res.status(500).json(error); // Добавлен return
    }

    return res.status(200).json(data); // Добавлен return
  } catch (e) {
    console.error("Error:", e); // Лучше использовать console.error для ошибок
    return res.status(500).json({ error: e.message });
  }
});

router.get("/bookById/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    let { data: Book, error } = await supabase
      .from("Books")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      res.status(404).josn(error);
    }
    res.status(200).json(Book);
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

router.post("/favouriteBooks", async (req, res) => {
  try {
    const { book } = req.body; // Получаем объект книги из тела запроса

    // Проверяем обязательные поля книги
    if (!book || !book.id) {
      return res.status(400).json({ error: "Book object with id is required" });
    }

    // Аутентификация пользователя
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Подготавливаем данные пользователя
    const userData = {
      userId: user.id,
    };

    // Получаем текущую запись пользователя
    const { data: existingRecord, error: findError } = await supabase
      .from("favouriteBooksOfUser")
      .select("*")
      .eq("user_id->>userId", user.id)
      .maybeSingle();

    if (findError) throw findError;

    // Подготавливаем объект книги с дополнительными метаданными
    const bookEntry = {
      ...book, // Включаем все полученные данные книги
    };

    if (existingRecord) {
      // Проверяем наличие книги в избранном
      const currentBooks = existingRecord.books_id || [];
      const existingBookIndex = currentBooks.findIndex((b) => b.id === book.id);

      if (existingBookIndex !== -1) {
        // Удаляем книгу если она уже есть
        const updatedBooks = [
          ...currentBooks.slice(0, existingBookIndex),
          ...currentBooks.slice(existingBookIndex + 1),
        ];

        const { data, error: updateError } = await supabase
          .from("favouriteBooksOfUser")
          .update({
            books_id: updatedBooks.length > 0 ? updatedBooks : null,
          })
          .eq("id", existingRecord.id)
          .select();

        if (updateError) throw updateError;
        return res.status(200).json({
          action: "removed",
          bookId: book.id,
          data,
        });
      } else {
        // Добавляем новую книгу
        const updatedBooks = [...currentBooks, bookEntry];
        const { data, error: updateError } = await supabase
          .from("favouriteBooksOfUser")
          .update({
            books_id: updatedBooks,
          })
          .eq("id", existingRecord.id)
          .select();

        if (updateError) throw updateError;
        return res.status(200).json({
          action: "added",
          data,
        });
      }
    } else {
      // Создаем новую запись для пользователя
      const { data, error: insertError } = await supabase
        .from("favouriteBooksOfUser")
        .insert({
          user_id: userData,
          books_id: [bookEntry], // Начинаем с массива из одной книги
        })
        .select();

      if (insertError) throw insertError;
      return res.status(200).json({
        action: "added",
        data,
      });
    }
  } catch (e) {
    console.error("Error:", e);
    return res.status(500).json({
      error: e.message,
      details: e.details,
      code: e.code,
    });
  }
});
router.get("/favouriteBooks/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = user.id;

    const { data: userFavorites, error: fetchError } = await supabase
      .from("favouriteBooksOfUser")
      .select("books_id")
      .eq("user_id->>userId", user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const favorites = userFavorites?.books_id || [];

    const book = favorites.find((b) => b.id === bookId);

    if (!book) {
      return res.status(200).json({
        isFavourite: false,
      });
    }

    // 4. Дополнительно: получаем полные данные книги
    const { data: fullBookData, error: bookError } = await supabase
      .from("Books")
      .select("*")
      .eq("id", bookId)
      .single();

    // 5. Формируем ответ
    return res.status(200).json({
      isFavorite: true,
    });
  } catch (e) {
    res.status(500).json(e);
  }
});
router.get("/favouriteBooks", async (req, res) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = user.id;

    const { data, error } = await supabase
      .from("favouriteBooksOfUser")
      .select("books_id")
      .eq("user_id->>userId", userId)
      .single();

    if (error) throw error;

    return res.status(200).json({
      books: data?.books_id || [],
    });
  } catch (e) {
    res.status(500).json(e);
  }
});
router.get("/getBookByTitle/:title", async (req, res) => {
  try {
    const { title } = req.params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = user.id;

    const { data: selectedBook, error: fetchError } = await supabase
      .from("Books")
      .select("*")
      .eq("title", title)
      .select();

    if (fetchError) throw fetchError;

    if (selectedBook.length > 1) {
      // Если найдено несколько книг с одинаковым названием
      return res
        .status(200)
        .json(Array.isArray(selectedBook) ? selectedBook[0] : selectedBook);
    }

    if (!selectedBook) {
      return res.status(404).json({ message: "Такой книги нет" });
    }

    // 5. Формируем ответ
    return res
      .status(200)
      .json(Array.isArray(selectedBook) ? selectedBook[0] : selectedBook);
  } catch (e) {
    res.status(500).json(e);
  }
});
router.put("/updateBook/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const updatedBookData = req.body;
    // 1. Проверка аутентификации пользователя

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data: existingBook, error: fetchError } = await supabase
      .from("Books")
      .select("*")
      .eq("id", bookId)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw fetchError;
    }

    if (!existingBook) {
      console.log("Book not found or access denied");
      return res.status(404).json({ error: "Book not found or access denied" });
    }

    // 3. Подготовка данных для обновления
    const updatePayload = {
      ...existingBook,
      ...updatedBookData,
      status: {
        ...existingBook.status,
        ...updatedBookData.status,

        ...(updatedBookData.status?.isRented === false && {
          isRentedBy: null,
        }),

        ...(updatedBookData.status?.isBought === false && {
          isBoughtBy: null,
        }),
      },
    };

    // 4. Выполнение обновления в базе данных
    const { data: updatedBook, error: updateError } = await supabase
      .from("Books")
      .update(updatePayload)
      .eq("id", bookId)
      .select();

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    if (!updatedBook) {
      return res
        .status(500)
        .json({ error: "Update failed - no data returned" });
    }

    return res.status(200).json(updatedBook);
  } catch (e) {
    console.error("Error updating book:", e);

    // Определяем тип ошибки для более информативного ответа
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (e instanceof Error) {
      if (e.message.includes("duplicate key")) {
        errorMessage = "Book with this title already exists";
        statusCode = 409;
      }
    }

    return res.status(statusCode).json({
      error: errorMessage,
      details: e instanceof Error ? e.message : String(e),
    });
  }
});

router.delete("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data: selectedBook, error: fetchError } = await supabase
      .from("Books")
      .select("*")
      .eq("id", bookId)
      .select();

    if (fetchError) throw fetchError;
    if (!selectedBook) {
      return res.status(404).json({ message: "Такой книги нет" });
    }

    const { error } = await supabase.from("Books").delete().eq("id", bookId);
    if (error) throw error;
    res.status(200).json({ message: `Успешно удалена книга с id ${bookId}` });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: `Ошибка удаления ${JSON.stringify(e)}` });
  }
});
router.get("/arendedBooks", async (req, res) => {
  try {
    // 1. Проверка аутентификации
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = user.id;

    // 2. Запрос книг, где пользователь арендатор
    const { data: books, error } = await supabase
      .from("Books")
      .select("*")
      .contains("status", {
        isRentedBy: {
          user: {
            user_id: userId,
          },
        },
      });

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // 3. Фильтрация только арендованных книг (доп. проверка)
    const rentedBooks = books.filter(
      (book) =>
        book.status.isRented && book.status.isRentedBy?.user?.user_id === userId
    );

    return res.status(200).json(rentedBooks);
  } catch (e) {
    console.error("Server error:", e);
    return res.status(500).json({
      error: "Internal server error",
      details: e instanceof Error ? e.message : String(e),
    });
  }
});
export default router;
