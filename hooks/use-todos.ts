"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: Date | string | null;
  categoryId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
};

type ApiResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: string;
};

export function useTodos(initialData?: Todo[]) {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Failed to fetch todos");
      const json: ApiResponse<Todo[]> = await res.json();
      return json.data;
    },
    initialData,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; categoryId?: string; dueDate?: string }) => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create todo");
      const json: ApiResponse<Todo> | ApiErrorResponse = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; title?: string; completed?: boolean; categoryId?: string | null; dueDate?: string | null }) => {
      const { id, ...updateData } = data;
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      const json: ApiResponse<Todo> | ApiErrorResponse = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((todo) => {
          if (todo.id !== newData.id) return todo;
          const updated = { ...todo };
          if (newData.completed !== undefined)
            updated.completed = newData.completed;
          if (newData.title !== undefined) updated.title = newData.title;
          if (newData.categoryId !== undefined)
            updated.categoryId = newData.categoryId ?? null;
          return updated;
        }),
      );

      return { previous };
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string }) => {
      const res = await fetch(`/api/todos/${data.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete todo");
      const json: ApiResponse<null> | ApiErrorResponse = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onMutate: async (deletedData) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.filter((todo) => todo.id !== deletedData.id),
      );

      return { previous };
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
