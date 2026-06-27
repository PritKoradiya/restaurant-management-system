import { useContext, useEffect, useState } from "react";
import { OrderContext } from "../../App";
import api from "../../services/api";

const CATEGORY_OPTIONS = [
  "Main Course",
  "Bread",
  "South Indian",
  "Starter",
  "Side Dish",
  "Beverage",
  "Dessert",
  "Thali",
];

const resolveImage = (item) => {
  if (item.image && item.image.trim()) {
    return item.image;
  }

  return `https://source.unsplash.com/300x220/?${encodeURIComponent(item.category || "food")}`;
};

function Menu() {
  const { menuItems, setMenuItems } = useContext(OrderContext);
  const [editingId, setEditingId] = useState(null);
  const [editedItem, setEditedItem] = useState({
    name: "",
    description: "",
    category: "",
    image: "",
    isAvailable: true,
    price: "",
  });
  const [menuError, setMenuError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidPrice = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
  };

  const isNonEmpty = (value) => String(value || "").trim().length > 0;

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const response = await api.getMenuItems();
        const normalizedMenuItems = (response.items || []).map((item) => ({
          ...item,
          id: item.id || item._id,
        }));
        setMenuItems(normalizedMenuItems);
      } catch (error) {
        setMenuError(error.message || "Failed to load menu items");
      }
    };

    loadMenuItems();
  }, [setMenuItems]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditedItem({
      name: item.name || "",
      description: item.description || "",
      category: item.category || "",
      image: item.image || "",
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      price: item.price || "",
    });
  };

  const saveEdit = async (id) => {
    if (!isNonEmpty(editedItem.name) || !isNonEmpty(editedItem.description) || !isNonEmpty(editedItem.category) || !isValidPrice(editedItem.price)) {
      setMenuError("Please enter valid name, description, category and price.");
      return;
    }

    try {
      setMenuError("");
      setIsSubmitting(true);
      const payload = {
        ...editedItem,
        price: Number(editedItem.price),
      };
      const response = await api.updateMenuItem(id, payload);
      const updatedItem = {
        ...response.item,
        id: response.item?.id || response.item?._id || id,
      };

      setMenuItems((prevItems) => prevItems.map((item) => (item.id === id ? updatedItem : item)));
      setEditingId(null);
    } catch (error) {
      setMenuError(error.message || "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };


  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: CATEGORY_OPTIONS[0],
    image: "",
    isAvailable: true,
    price: "",
  });

  const addItem = async () => {
    if (!isNonEmpty(newItem.name) || !isNonEmpty(newItem.description) || !isNonEmpty(newItem.category) || !isValidPrice(newItem.price)) {
      setMenuError("Please enter valid name, description, category and price.");
      return;
    }

    try {
      setMenuError("");
      setIsSubmitting(true);
      const response = await api.createMenuItem({
        ...newItem,
        price: Number(newItem.price),
      });

      const createdItem = {
        ...response.item,
        id: response.item?.id || response.item?._id,
      };

      setMenuItems((prevItems) => [...prevItems, createdItem]);

      setNewItem({
        name: "",
        description: "",
        category: CATEGORY_OPTIONS[0],
        image: "",
        isAvailable: true,
        price: "",
      });
    } catch (error) {
      setMenuError(error.message || "Failed to create item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    const confirmDelete = window.confirm("Are you sure?");
    if (!confirmDelete) return;

    try {
      setMenuError("");
      setIsSubmitting(true);
      await api.deleteMenuItem(id);
      setMenuItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (error) {
      setMenuError(error.message || "Failed to delete item");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Management</h1>

      {menuError && (
        <p style={{ color: "#dc3545", marginTop: "12px" }}>{menuError}</p>
      )}

<div
  style={{
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginTop: "20px",
    marginBottom: "20px",
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    alignItems: "stretch",
  }}
>
  <input
    type="text"
    placeholder="Item Name"
    value={newItem.name}
    onChange={(e) =>
      setNewItem({ ...newItem, name: e.target.value })
    }
    style={inputStyle}
  />

  <input
    type="text"
    placeholder="Description"
    value={newItem.description}
    onChange={(e) =>
      setNewItem({ ...newItem, description: e.target.value })
    }
    style={inputStyle}
  />

  <select
    value={newItem.category}
    onChange={(e) =>
      setNewItem({ ...newItem, category: e.target.value })
    }
    style={inputStyle}
  >
    {CATEGORY_OPTIONS.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Image URL (optional)"
    value={newItem.image}
    onChange={(e) =>
      setNewItem({ ...newItem, image: e.target.value })
    }
    style={inputStyle}
  />

  <input
    type="number"
    placeholder="Price"
    value={newItem.price}
    onChange={(e) =>
      setNewItem({ ...newItem, price: e.target.value })
    }
    style={inputStyle}
  />

  <label style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "42px" }}>
    <input
      type="checkbox"
      checked={newItem.isAvailable}
      onChange={(e) =>
        setNewItem({ ...newItem, isAvailable: e.target.checked })
      }
    />
    Available
  </label>

  <button onClick={addItem} style={buttonStyle} disabled={isSubmitting}>
    {isSubmitting ? "Saving..." : "+ Add Item"}
  </button>
</div>


      <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: "680px",
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={cellStyle}>ID</th>
            <th style={cellStyle}>Image</th>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Description</th>
            <th style={cellStyle}>Category</th>
            <th style={cellStyle}>Available</th>
            <th style={cellStyle}>Price (₹)</th>
            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {menuItems.map((item) => (
  <tr key={item.id}>
    <td style={cellStyle}>{item.id}</td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          value={editedItem.image}
          placeholder="Image URL"
          onChange={(e) =>
            setEditedItem({ ...editedItem, image: e.target.value })
          }
        />
      ) : (
        <img
          src={resolveImage(item)}
          alt={item.name}
          style={{ width: "68px", height: "48px", objectFit: "cover", borderRadius: "6px", margin: "0 auto" }}
          onError={(e) => {
            e.currentTarget.src = `https://source.unsplash.com/300x220/?${encodeURIComponent(item.name || "food")}`;
          }}
        />
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          value={editedItem.name}
          onChange={(e) =>
            setEditedItem({ ...editedItem, name: e.target.value })
          }
        />
      ) : (
        item.name
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          value={editedItem.description}
          onChange={(e) =>
            setEditedItem({ ...editedItem, description: e.target.value })
          }
        />
      ) : (
        item.description || "-"
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <select
          value={editedItem.category}
          onChange={(e) =>
            setEditedItem({ ...editedItem, category: e.target.value })
          }
        >
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      ) : (
        item.category || "-"
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          type="checkbox"
          checked={editedItem.isAvailable}
          onChange={(e) =>
            setEditedItem({ ...editedItem, isAvailable: e.target.checked })
          }
        />
      ) : item.isAvailable ? (
        "Yes"
      ) : (
        "No"
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          type="number"
          value={editedItem.price}
          onChange={(e) =>
            setEditedItem({ ...editedItem, price: e.target.value })
          }
        />
      ) : (
        item.price
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <button onClick={() => saveEdit(item.id)} disabled={isSubmitting}>Save</button>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          <button onClick={() => startEdit(item)} style={editBtn}>
            Edit
          </button>

          <button
            onClick={() => deleteItem(item.id)}
            style={deleteBtn}
            disabled={isSubmitting}
          >
            Delete
          </button>
        </div>
      )}
    </td>
  </tr>
))}

        </tbody>
      </table>
      </div>
    </div>
  );
}

const editBtn = {
  padding: "6px 10px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  marginRight: "8px",
  cursor: "pointer",
};

const deleteBtn = {
  padding: "6px 10px",
  background: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};


const cellStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  textAlign: "center",
  whiteSpace: "normal",
  wordBreak: "break-word",
};

const inputStyle = {
  flex: "1 1 180px",
  minWidth: "160px",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  outline: "none",
};

const buttonStyle = {
  padding: "8px 15px",
  borderRadius: "4px",
  border: "none",
  background: "#4CAF50",
  color: "white",
  cursor: "pointer",
};


export default Menu;
