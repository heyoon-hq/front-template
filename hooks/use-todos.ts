"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTodos, createTodo, updateTodo, deleteTodo } from "@/server/actions/todo"

type Todo = Awaited<ReturnType<typeof getTodos>>[number]

export function useTodos(initialData?: Todo[]) {
  return useQuery({
    queryKey: ["todos"],
    queryFn: () => getTodos(),
    initialData,
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => createTodo(formData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["todos"] })
      }
    },
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof updateTodo>[0]) => updateTodo(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] })
      const previous = queryClient.getQueryData<Todo[]>(["todos"])

      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((todo) => {
          if (todo.id !== newData.id) return todo
          const updated = { ...todo }
          if (newData.completed !== undefined) updated.completed = newData.completed
          if (newData.title !== undefined) updated.title = newData.title
          if (newData.categoryId !== undefined) updated.categoryId = newData.categoryId ?? null
          return updated
        })
      )

      return { previous }
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string }) => deleteTodo(data),
    onMutate: async (deletedData) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] })
      const previous = queryClient.getQueryData<Todo[]>(["todos"])

      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.filter((todo) => todo.id !== deletedData.id)
      )

      return { previous }
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}
