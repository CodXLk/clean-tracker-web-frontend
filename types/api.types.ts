export type ApiResponse<T> = {
  data:       T;
  message:    string;
  status:     number;
  timestamp?: string;
};

export type ApiErrorResponse = {
  message:    string;
  status:     number;
  errors?:    Record<string, string[]>;
  timestamp?: string;
};
