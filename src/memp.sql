-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 15, 2025 at 09:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `memp`
--

-- --------------------------------------------------------

--
-- Table structure for table `assembly_assembled_items`
--

CREATE TABLE `assembly_assembled_items` (
  `id` int(11) NOT NULL,
  `shift_number` varchar(50) NOT NULL,
  `report_date` date NOT NULL,
  `shift` enum('morning','day','night') NOT NULL,
  `ceb_quantity` int(11) DEFAULT 0,
  `ceb_qc_no_start` varchar(50) DEFAULT NULL,
  `ceb_qc_no_end` varchar(50) DEFAULT NULL,
  `leco1_quantity` int(11) DEFAULT 0,
  `leco1_qc_no_start` varchar(50) DEFAULT NULL,
  `leco1_qc_no_end` varchar(50) DEFAULT NULL,
  `leco2_quantity` int(11) DEFAULT 0,
  `leco2_qc_no_start` varchar(50) DEFAULT NULL,
  `leco2_qc_no_end` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assembly_assembled_items`
--

INSERT INTO `assembly_assembled_items` (`id`, `shift_number`, `report_date`, `shift`, `ceb_quantity`, `ceb_qc_no_start`, `ceb_qc_no_end`, `leco1_quantity`, `leco1_qc_no_start`, `leco1_qc_no_end`, `leco2_quantity`, `leco2_qc_no_start`, `leco2_qc_no_end`, `created_at`) VALUES
(3, '5 250649', '2025-08-05', 'morning', 5, '1', '5', 5, '1', '4', 4, '1', '4', '2025-08-05 07:17:42'),
(4, '4 250648', '2025-08-04', 'night', 32, '1', '2', 32, '1', '22', 32, '1', '2', '2025-08-05 07:18:14'),
(5, '14 250676', '2025-08-14', 'morning', 25, '1', '1', 22, '1', '1', 20, '1', '1', '2025-08-14 04:38:05'),
(6, '14 250677', '2025-08-14', 'day', 22, '5', '5', 22, '5', '5', 22, '5', '5', '2025-08-14 05:13:32');

--
-- Triggers `assembly_assembled_items`
--
DELIMITER $$
CREATE TRIGGER `update_total_assembled_products` AFTER INSERT ON `assembly_assembled_items` FOR EACH ROW BEGIN
    UPDATE total_assembled_products
    SET 
        total_ceb_quantity = total_ceb_quantity + NEW.ceb_quantity,
        total_leco1_quantity = total_leco1_quantity + NEW.leco1_quantity,
        total_leco2_quantity = total_leco2_quantity + NEW.leco2_quantity,
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `assembly_received_items`
--

CREATE TABLE `assembly_received_items` (
  `id` int(11) NOT NULL,
  `shift_number` varchar(50) NOT NULL,
  `report_date` date NOT NULL,
  `shift` enum('morning','day','night') NOT NULL,
  `ceb_covers` int(11) DEFAULT 0,
  `leco_covers` int(11) DEFAULT 0,
  `base` int(11) DEFAULT 0,
  `shutters` int(11) DEFAULT 0,
  `cover_beading` int(11) DEFAULT 0,
  `shutter_beading` int(11) DEFAULT 0,
  `springs` int(11) DEFAULT 0,
  `corrugated_boxes` int(11) DEFAULT 0,
  `sellotapes` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assembly_received_items`
--

INSERT INTO `assembly_received_items` (`id`, `shift_number`, `report_date`, `shift`, `ceb_covers`, `leco_covers`, `base`, `shutters`, `cover_beading`, `shutter_beading`, `springs`, `corrugated_boxes`, `sellotapes`, `created_at`) VALUES
(1, '1 250637', '2025-08-01', 'morning', 1, 1, 1, 0, 1, 1, 1, 1, 1, '2025-08-01 06:42:22');

-- --------------------------------------------------------

--
-- Table structure for table `assembly_rejected_items`
--

CREATE TABLE `assembly_rejected_items` (
  `id` int(11) NOT NULL,
  `shift_number` varchar(50) NOT NULL,
  `report_date` date NOT NULL,
  `shift` enum('morning','day','night') NOT NULL,
  `ceb_covers` int(11) DEFAULT 0,
  `leco_covers` int(11) DEFAULT 0,
  `base` int(11) DEFAULT 0,
  `shutters` int(11) DEFAULT 0,
  `cover_beading` int(11) DEFAULT 0,
  `shutter_beading` int(11) DEFAULT 0,
  `springs` int(11) DEFAULT 0,
  `corrugated_boxes` int(11) DEFAULT 0,
  `sellotapes` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `defective_crushed_reports`
--

CREATE TABLE `defective_crushed_reports` (
  `id` bigint(20) NOT NULL,
  `shift_number` bigint(20) NOT NULL,
  `report_date` date NOT NULL,
  `shift` enum('morning','day','night') NOT NULL,
  `received_quantity` int(11) NOT NULL DEFAULT 0,
  `received_weight` decimal(10,2) NOT NULL DEFAULT 0.00,
  `crushed_pc_weight` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `defective_crushed_reports`
--

INSERT INTO `defective_crushed_reports` (`id`, `shift_number`, `report_date`, `shift`, `received_quantity`, `received_weight`, `crushed_pc_weight`, `created_at`) VALUES
(1, 250592, '2025-07-17', 'morning', 22, 2.00, 2.00, '2025-07-31 10:53:03'),
(2, 250670, '2025-08-12', 'morning', 10, 10.00, 10.00, '2025-08-12 11:58:50'),
(3, 250674, '2025-08-13', 'day', 20, 20.00, 20.00, '2025-08-13 08:12:06');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_notes`
--

CREATE TABLE `delivery_notes` (
  `id` int(11) NOT NULL,
  `delivery_note_number` varchar(50) NOT NULL,
  `received_by_name` varchar(100) NOT NULL,
  `signature` varchar(255) DEFAULT NULL,
  `delivery_date` date NOT NULL,
  `customer` varchar(100) NOT NULL,
  `description` enum('CEB Meter Enclosure','LECO Meter Enclosure') NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` >= 0),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_notes`
--

INSERT INTO `delivery_notes` (`id`, `delivery_note_number`, `received_by_name`, `signature`, `delivery_date`, `customer`, `description`, `quantity`, `created_at`) VALUES
(1, 'DN2025217-01', 'fgf', 'kanishka', '2025-08-05', 'ceb', 'CEB Meter Enclosure', 20, '2025-08-05 09:45:11'),
(2, 'DN2025225-01', 'dsds', 'dsdsr', '2025-08-13', 'gees', 'CEB Meter Enclosure', 0, '2025-08-13 10:16:34');

-- --------------------------------------------------------

--
-- Table structure for table `production_shift_reports`
--

CREATE TABLE `production_shift_reports` (
  `id` int(11) NOT NULL,
  `shift_number` varchar(20) NOT NULL,
  `report_date` date NOT NULL,
  `shift` enum('morning','day','night') NOT NULL,
  `product_type` enum('ceb_covers','leco_covers','base','shutters','cover_beading','shutter_beading','springs','corrugated_boxes','sellotapes') NOT NULL,
  `raw_material_pc` decimal(10,2) DEFAULT 0.00,
  `raw_material_crushed_pc` decimal(10,2) DEFAULT 0.00,
  `raw_material_mb` decimal(10,2) DEFAULT 0.00,
  `good_products_qty` int(11) DEFAULT 0,
  `good_products_weight` decimal(10,2) DEFAULT 0.00,
  `defective_products_qty` int(11) DEFAULT 0,
  `defective_products_weight` decimal(10,2) DEFAULT 0.00,
  `wastage` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `production_shift_reports`
--

INSERT INTO `production_shift_reports` (`id`, `shift_number`, `report_date`, `shift`, `product_type`, `raw_material_pc`, `raw_material_crushed_pc`, `raw_material_mb`, `good_products_qty`, `good_products_weight`, `defective_products_qty`, `defective_products_weight`, `wastage`, `created_at`) VALUES
(1, '1 250637', '2025-08-01', 'morning', 'ceb_covers', 1.00, NULL, 1.00, 1, 1.00, 1, 1.00, 1.00, '2025-08-01 06:38:57'),
(2, '1 250637', '2025-08-01', 'morning', 'leco_covers', 1.00, NULL, 1.00, 1, 1.00, 1, 1.00, 1.00, '2025-08-01 06:38:57'),
(3, '1 250637', '2025-08-01', 'morning', 'base', 1.00, NULL, 1.00, 1, 1.00, 1, 1.00, 1.00, '2025-08-01 06:38:57'),
(4, '1 250637', '2025-08-01', 'morning', 'shutters', 1.00, NULL, 1.00, 1, 1.00, 1, 1.00, 1.00, '2025-08-01 06:38:57');

-- --------------------------------------------------------

--
-- Table structure for table `shift_dispatch_entries`
--

CREATE TABLE `shift_dispatch_entries` (
  `id` int(11) NOT NULL,
  `summary_id` int(11) NOT NULL,
  `entry_number` int(11) NOT NULL,
  `customer` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `invoice_no` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shift_dispatch_entries`
--

INSERT INTO `shift_dispatch_entries` (`id`, `summary_id`, `entry_number`, `customer`, `quantity`, `invoice_no`) VALUES
(1, 1, 1, 'Kamal', 22, '3232323'),
(2, 1, 2, 'Amal', 22, '322323'),
(3, 1, 3, 'Bimal', 22, '322321'),
(4, 1, 4, 'Nimal', 12, '45677'),
(5, 1, 5, 'Sunil', 12, '456543'),
(6, 1, 6, NULL, NULL, NULL),
(7, 1, 7, NULL, NULL, NULL),
(8, 1, 8, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `shift_dispatch_summaries`
--

CREATE TABLE `shift_dispatch_summaries` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `shift` varchar(20) NOT NULL,
  `shift_number` varchar(20) NOT NULL,
  `total_quantity` int(11) DEFAULT NULL,
  `balance_ceb` int(11) DEFAULT NULL,
  `balance_leco` int(11) DEFAULT NULL,
  `pla_name` varchar(100) DEFAULT NULL,
  `supervisor_name` varchar(100) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shift_dispatch_summaries`
--

INSERT INTO `shift_dispatch_summaries` (`id`, `date`, `shift`, `shift_number`, `total_quantity`, `balance_ceb`, `balance_leco`, `pla_name`, `supervisor_name`, `manager_name`, `created_at`) VALUES
(1, '2025-08-12', 'day', '12 250671', 34, NULL, NULL, 'trtrtr', 'trtry', 'Kanishka Ravindranath', '2025-08-12 07:23:34');

-- --------------------------------------------------------

--
-- Table structure for table `stock_items`
--

CREATE TABLE `stock_items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_items`
--

INSERT INTO `stock_items` (`id`, `name`, `quantity`, `created_at`) VALUES
(1, 'CEB Covers', 1102, '2025-08-01 06:42:22'),
(2, 'LECO Covers', 684, '2025-08-01 06:42:22'),
(3, 'Base', 1035, '2025-08-01 06:42:22'),
(4, 'Shutters', 850, '2025-08-01 06:38:57'),
(5, 'Defective Quantity', 4024, '2025-08-01 06:38:57'),
(6, 'Defective Weight', 4089, '2025-08-01 06:38:57'),
(7, 'PC', 38, '2025-08-01 06:38:57'),
(8, 'Crushed PC', 189, '2025-05-21 05:28:47'),
(9, 'MB', 240, '2025-08-01 06:38:57'),
(10, 'Cover Beading', 357, '2025-08-01 06:42:22'),
(11, 'Shutter Beading', 576, '2025-08-01 06:42:22'),
(12, 'Springs', 322, '2025-08-01 06:42:22'),
(13, 'corrugated_boxes', 468, '2025-08-01 06:42:22'),
(14, 'sellotapes', 187, '2025-08-01 06:42:22');

-- --------------------------------------------------------

--
-- Table structure for table `total_assembled_products`
--

CREATE TABLE `total_assembled_products` (
  `id` int(11) NOT NULL,
  `total_ceb_quantity` int(11) DEFAULT 0,
  `total_leco1_quantity` int(11) DEFAULT 0,
  `total_leco2_quantity` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `total_assembled_products`
--

INSERT INTO `total_assembled_products` (`id`, `total_ceb_quantity`, `total_leco1_quantity`, `total_leco2_quantity`, `last_updated`) VALUES
(1, 64, 81, 78, '2025-08-14 05:13:32');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `userType` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `isManager` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `mobile`, `password`, `userType`, `created_at`, `isManager`) VALUES
(1, 'P M Indrachapa', 'vilochanaudantha@gmail.com', '0704756072', 'vilo00', 'user', '2025-07-31 06:15:12', 0),
(2, 'vilo', 'vilo@gmail.com', '0723456757', '$2b$10$jJX7Egsdvt65cF7F4hrYg.BcXD9vIKn/TbLx8IjmH2LOUHpHE1NY6', 'user', '2025-07-31 06:23:43', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assembly_assembled_items`
--
ALTER TABLE `assembly_assembled_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assembly_received_items`
--
ALTER TABLE `assembly_received_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assembly_rejected_items`
--
ALTER TABLE `assembly_rejected_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `defective_crushed_reports`
--
ALTER TABLE `defective_crushed_reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `delivery_notes`
--
ALTER TABLE `delivery_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `delivery_note_number` (`delivery_note_number`),
  ADD KEY `idx_delivery_date` (`delivery_date`),
  ADD KEY `idx_delivery_note_number` (`delivery_note_number`);

--
-- Indexes for table `production_shift_reports`
--
ALTER TABLE `production_shift_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shift_number` (`shift_number`),
  ADD KEY `product_type` (`product_type`);

--
-- Indexes for table `shift_dispatch_entries`
--
ALTER TABLE `shift_dispatch_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `summary_id` (`summary_id`);

--
-- Indexes for table `shift_dispatch_summaries`
--
ALTER TABLE `shift_dispatch_summaries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_shift_number` (`shift_number`);

--
-- Indexes for table `stock_items`
--
ALTER TABLE `stock_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `total_assembled_products`
--
ALTER TABLE `total_assembled_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assembly_assembled_items`
--
ALTER TABLE `assembly_assembled_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `assembly_received_items`
--
ALTER TABLE `assembly_received_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `assembly_rejected_items`
--
ALTER TABLE `assembly_rejected_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `defective_crushed_reports`
--
ALTER TABLE `defective_crushed_reports`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `delivery_notes`
--
ALTER TABLE `delivery_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `production_shift_reports`
--
ALTER TABLE `production_shift_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `shift_dispatch_entries`
--
ALTER TABLE `shift_dispatch_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `shift_dispatch_summaries`
--
ALTER TABLE `shift_dispatch_summaries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `total_assembled_products`
--
ALTER TABLE `total_assembled_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `shift_dispatch_entries`
--
ALTER TABLE `shift_dispatch_entries`
  ADD CONSTRAINT `shift_dispatch_entries_ibfk_1` FOREIGN KEY (`summary_id`) REFERENCES `shift_dispatch_summaries` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
