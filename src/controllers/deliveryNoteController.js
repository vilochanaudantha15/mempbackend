import DeliveryNoteModel from "../models/deliveryNoteModel.js";

export const createDeliveryNote = async (req, res) => {
  try {
    const { deliveryNoteNumber, receivedByName, signature, deliveryDate, customer, description, quantity } = req.body;

    if (!deliveryNoteNumber || !receivedByName || !deliveryDate || !customer || !description || !quantity) {
      return res.status(400).json({ message: "Delivery note number, received by name, delivery date, customer, description, and quantity are required" });
    }

    if (isNaN(quantity) || parseInt(quantity) < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const noteData = {
      deliveryNoteNumber,
      receivedByName,
      signature,
      deliveryDate,
      customer,
      description,
      quantity: parseInt(quantity),
    };

    const isCreated = await DeliveryNoteModel.createDeliveryNote(noteData);
    if (isCreated) {
      res.status(201).json({ message: "Delivery note created successfully" });
    } else {
      res.status(500).json({ message: "Failed to create delivery note" });
    }
  } catch (error) {
    console.error("Error creating delivery note:", error);
    if (error.message.includes("Stock item") || error.message.includes("Insufficient stock") || error.message.includes("Insufficient assembled quantity")) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Duplicate")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getAllDeliveryNotes = async (req, res) => {
  try {
    const filters = {
      date: req.query.date,
    };
    const notes = await DeliveryNoteModel.getAllDeliveryNotes(filters);
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error fetching delivery notes:", error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};