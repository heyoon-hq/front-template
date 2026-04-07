-- AlterTable: Category에 updatedAt 추가 (기존 행은 현재 시각으로 초기화)
ALTER TABLE "Category" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Todo-Category 관계에 onDelete: SetNull 적용
ALTER TABLE "Todo" DROP CONSTRAINT IF EXISTS "Todo_categoryId_fkey";
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
