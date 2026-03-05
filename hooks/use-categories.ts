"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/server/actions/category"

type Category = Awaited<ReturnType<typeof getCategories>>[number]

export function useCategories(initialData?: Category[]) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    initialData,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => createCategory(formData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["categories"] })
      }
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof updateCategory>[0]) =>
      updateCategory(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { id: string }) => deleteCategory(data),
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
