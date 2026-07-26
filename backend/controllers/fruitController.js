import Fruit from "../models/Fruit.js";
import { badRequest, notFoundError } from "../middleware/errorHandler.js";

function fruitInput(body) {
  const { fruitName, packageType, availableQuantity, price, imageUrl } = body;
  if (!fruitName?.trim() || !packageType?.trim()) throw badRequest("Fruit name and package type are required.");
  if (!Number.isFinite(Number(availableQuantity)) || Number(availableQuantity) < 0) throw badRequest("Available quantity must be zero or greater.");
  if (!Number.isFinite(Number(price)) || Number(price) < 0) throw badRequest("Price must be zero or greater.");
  
  if (imageUrl && imageUrl.length > 1400000) {
    throw badRequest("Fruit image file size exceeds the 1MB limit. Please upload a smaller image.");
  }

  return {
    FruitName: fruitName.trim(),
    PackageType: packageType.trim(),
    AvailableQuantity: Number(availableQuantity),
    Price: Number(price),
    imageUrl: imageUrl || ""
  };
}

async function getNextFruitId() {
  const lastFruit = await Fruit.findOne().sort({ FruitID: -1 });
  let nextNum = 1;
  if (lastFruit && lastFruit.FruitID) {
    const lastNum = parseInt(lastFruit.FruitID.replace("FR", ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  return `FR${String(nextNum).padStart(3, "0")}`;
}

export async function listFruits(req, res) {
  const query = req.query.search?.toLowerCase().trim();
  const rows = await Fruit.find().sort({ sortOrder: 1, FruitID: 1 });
  res.json(rows.filter((fruit) => !query || `${fruit.FruitName} ${fruit.PackageType}`.toLowerCase().includes(query)));
}

export async function createFruit(req, res) {
  const data = fruitInput(req.body);
  const fruit = { FruitID: await getNextFruitId(), ...data, CreatedDate: new Date().toISOString() };
  await Fruit.create(fruit);
  res.status(201).json(fruit);
}

export async function editFruit(req, res) {
  const fruit = await Fruit.findOne({ FruitID: req.params.id });
  if (!fruit) throw notFoundError("Fruit was not found.");
  const updated = await Fruit.findOneAndUpdate(
    { FruitID: req.params.id },
    fruitInput({
      fruitName: fruit.FruitName,
      packageType: fruit.PackageType,
      availableQuantity: fruit.AvailableQuantity,
      price: fruit.Price,
      imageUrl: fruit.imageUrl,
      ...req.body,
    }),
    { new: true }
  );
  res.json(updated);
}

export async function reorderFruits(req, res) {
  const { fruitIds } = req.body;
  if (!Array.isArray(fruitIds)) {
    throw badRequest("fruitIds array is required for reordering.");
  }
  const bulkOps = fruitIds.map((id, index) => ({
    updateOne: {
      filter: { FruitID: id },
      update: { sortOrder: index }
    }
  }));
  if (bulkOps.length > 0) {
    await Fruit.bulkWrite(bulkOps);
  }
  
  const io = req.app.get("io");
  if (io) {
    io.emit("fruit_reordered", { fruitIds });
  }

  const updatedRows = await Fruit.find().sort({ sortOrder: 1, FruitID: 1 });
  res.json(updatedRows);
}

export async function removeFruit(req, res) {
  const fruit = await Fruit.findOne({ FruitID: req.params.id });
  if (!fruit) throw notFoundError("Fruit was not found.");
  await Fruit.findOneAndDelete({ FruitID: req.params.id });
  res.status(204).end();
}

