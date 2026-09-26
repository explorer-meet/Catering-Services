-- AlterTable
ALTER TABLE `Vendor` MODIFY `category` ENUM('VEGETABLES', 'GROCERY', 'DAIRY', 'BAKERY', 'MEAT', 'BEVERAGES', 'EQUIPMENT', 'DECORATION', 'STAFFING', 'TRANSPORT', 'PARTNER_CATERER', 'OTHER') NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE `B2BOrder` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `direction` ENUM('OUTGOING', 'INCOMING') NOT NULL,
    `status` ENUM('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `partnerName` VARCHAR(191) NOT NULL,
    `partnerPhone` VARCHAR(191) NULL,
    `partnerGst` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NULL,
    `eventName` VARCHAR(191) NOT NULL,
    `eventDate` DATETIME(3) NOT NULL,
    `eventTime` VARCHAR(191) NULL,
    `venue` VARCHAR(191) NULL,
    `paxCount` INTEGER NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `otherCharges` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `taxPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `ledgerEntryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `B2BOrder_orderNumber_key`(`orderNumber`),
    INDEX `B2BOrder_direction_eventDate_idx`(`direction`, `eventDate`),
    INDEX `B2BOrder_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `B2BOrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(12, 2) NOT NULL DEFAULT 1,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'plates',
    `rate` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    INDEX `B2BOrderItem_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `B2BOrderPayment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `paidOn` DATETIME(3) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `mode` ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER') NULL,
    `referenceNo` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `ledgerEntryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `B2BOrderPayment_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `B2BOrder` ADD CONSTRAINT `B2BOrder_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `B2BOrderItem` ADD CONSTRAINT `B2BOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `B2BOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `B2BOrderPayment` ADD CONSTRAINT `B2BOrderPayment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `B2BOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
