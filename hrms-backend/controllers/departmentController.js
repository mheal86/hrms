const Department = require('../models/Department');

// GET /api/departments
exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').trim();

    const filter = {};

    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);
      filter.$and = tokens.map((token) => ({
        $or: [
          { name: { $regex: token, $options: 'i' } },
          { description: { $regex: token, $options: 'i' } },
        ],
      }));
    }

    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      Department.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Department.countDocuments(filter),
    ]);

    res.status(200).json({
      data: departments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/departments/:id
exports.getById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/departments
exports.create = async (req, res) => {
  try {
    const department = new Department(req.body);
    const saved = await department.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/departments/:id
exports.update = async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/departments/:id
exports.remove = async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};