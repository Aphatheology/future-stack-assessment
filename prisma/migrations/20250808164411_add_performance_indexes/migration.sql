-- CreateIndex
CREATE INDEX `CartItem_cartId_idx` ON `CartItem`(`cartId`);

-- CreateIndex
CREATE INDEX `Product_stockLevel_idx` ON `Product`(`stockLevel`);

-- CreateIndex
CREATE INDEX `Product_createdAt_idx` ON `Product`(`createdAt`);

-- CreateIndex
CREATE INDEX `Product_price_idx` ON `Product`(`price`);

-- CreateIndex
CREATE INDEX `Product_name_idx` ON `Product`(`name`);

-- RenameIndex
ALTER TABLE `Cart` RENAME INDEX `Cart_createdBy_fkey` TO `Cart_createdBy_idx`;

-- RenameIndex
ALTER TABLE `CartItem` RENAME INDEX `CartItem_productId_fkey` TO `CartItem_productId_idx`;

-- RenameIndex
ALTER TABLE `Product` RENAME INDEX `Product_categoryId_fkey` TO `Product_categoryId_idx`;

-- RenameIndex
ALTER TABLE `Product` RENAME INDEX `Product_createdBy_fkey` TO `Product_createdBy_idx`;
