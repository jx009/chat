-- DropForeignKey
ALTER TABLE `conversations` DROP FOREIGN KEY `fk_conversations_model_id`;

-- DropForeignKey
ALTER TABLE `conversations` DROP FOREIGN KEY `fk_conversations_user_id`;

-- DropForeignKey
ALTER TABLE `memberships` DROP FOREIGN KEY `fk_memberships_source_order_id`;

-- DropForeignKey
ALTER TABLE `memberships` DROP FOREIGN KEY `fk_memberships_user_id`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `fk_messages_conversation_id`;

-- DropForeignKey
ALTER TABLE `operation_logs` DROP FOREIGN KEY `fk_operation_logs_user_id`;

-- DropForeignKey
ALTER TABLE `payment_orders` DROP FOREIGN KEY `fk_payment_orders_package_id`;

-- DropForeignKey
ALTER TABLE `payment_orders` DROP FOREIGN KEY `fk_payment_orders_user_id`;

-- DropForeignKey
ALTER TABLE `user_auths` DROP FOREIGN KEY `fk_user_auths_user_id`;

-- AlterTable
ALTER TABLE `conversations` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `membership_packages` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `memberships` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `model_configs` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `payment_configs` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `payment_orders` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user_auths` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `user_auths` ADD CONSTRAINT `user_auths_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_source_order_id_fkey` FOREIGN KEY (`source_order_id`) REFERENCES `payment_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `membership_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `model_configs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_logs` ADD CONSTRAINT `operation_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
