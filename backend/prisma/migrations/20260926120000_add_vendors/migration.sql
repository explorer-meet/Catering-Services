-- CreateTable
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('VEGETABLES', 'GROCERY', 'DAIRY', 'BAKERY', 'MEAT', 'BEVERAGES', 'EQUIPMENT', 'DECORATION', 'STAFFING', 'TRANSPORT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `contactPerson` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `gstNumber` VARCHAR(191) NULL,
    `paymentTerms` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `bankName` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `upiId` VARCHAR(191) NULL,
    `openingBalance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Vendor_category_idx`(`category`),
    UNIQUE INDEX `Vendor_name_phone_key`(`name`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorLedgerEntry` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `type` ENUM('PURCHASE', 'PAYMENT', 'CREDIT_NOTE', 'OPENING_BALANCE') NOT NULL,
    `entryDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `referenceNo` VARCHAR(191) NULL,
    `paymentMode` ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VendorLedgerEntry_vendorId_entryDate_idx`(`vendorId`, `entryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VendorLedgerEntry` ADD CONSTRAINT `VendorLedgerEntry_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
