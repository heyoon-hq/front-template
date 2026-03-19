"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type Category = {
  id: string
  name: string
  color: string
  createdAt: Date | string
}

type ApiResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  error: string
}

export function useCategories(initialData?: Category[]) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      const json: ApiResponse<Category[]> = await res.json()
      return json.data
    },
    initialData,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create category")
      const json: ApiResponse<Category> | ApiErrorResponse = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; color?: string }) => {
      const { id, ...updateData } = data
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      if (!res.ok) throw new Error("Failed to update category")
      const json: ApiResponse<Category> | ApiErrorResponse = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string }) => {
      const res = await fetch(`/api/categories/${data.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete category")
      const json: ApiResponse<null> | ApiErrorResponse = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onMutate: async (deletedData) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] })
      const previous = queryClient.getQueryData<Category[]>(["categories"])

      queryClient.setQueryData<Category[]>(["categories"], (old) =>
        old?.filter((cat) => cat.id !== deletedData.id)
      )

      return { previous }
    },
    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })
}
