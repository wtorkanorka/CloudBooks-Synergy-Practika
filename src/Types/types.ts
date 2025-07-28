export interface IIsBoughtBy {
  user: {
    user_id: string;
    first_name: string;
    last_name: string;
  };
  isBoughtAt: string;
}
export interface IIsRentedBy {
  user: {
    user_id: string;
    first_name: string;
    last_name: string;
  };
  is_rented_at: string;
  is_rented_end: string;
}

export interface IBook {
  id: string;
  category: string;
  author: {
    last_name: string;
    first_name: string;
  };
  createdAt: string;
  title: string;
  description: string;
  content: string;
  genre: string[];
  cost: number;
  status: {
    isBought: boolean;
    isRented: boolean;
    isBoughtBy: null | IIsBoughtBy;
    isRentedBy: null | IIsRentedBy;
  };
}
