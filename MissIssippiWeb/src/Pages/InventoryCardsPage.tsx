import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import SearchPanel from "../Components/SearchPanel";
import StyleCard from "../Components/StyleCard";
import { useInventoryStore } from "../inventory/inventoryStore";

export default function InventoryCardsPage() {
  const inventory = useInventoryStore((state) => state.inventory);
  const loading = useInventoryStore((state) => state.loading);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);

  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [displayedStyles, setDisplayedStyles] = useState<
    { styleNumber: string; description: string; variants: string[] }[]
  >([]);

  // Fetch once
  useEffect(() => {
    if (inventory.length === 0) fetchInventory();
  }, [fetchInventory, inventory.length]);

  // Build dropdown options
  const allOptions = Object.keys(inventory[0] || {}).reduce((acc, key) => {
    if (["sizes"].includes(key)) return acc;
    const uniqueValues = Array.from(new Set(inventory.map((i) => i[key]))).map((v) => ({
      value: v || "",
      label: v || "N/A",
    }));
    return { ...acc, [key]: uniqueValues };
  }, {} as Record<string, { value: string; label: string }[]>);

  const handleChangeFilter = (filterKey: string, selected: string[]) => {
    setFilters((prev) => ({ ...prev, [filterKey]: selected }));
  };

  const handleSearch = () => {
    let filtered = [...inventory];
    Object.entries(filters).forEach(([key, selectedValues]) => {
      if (selectedValues?.length) {
        filtered = filtered.filter((row) => selectedValues.includes(row[key]));
      }
    });

    // Group by styleNumber
    const grouped = Object.values(
      filtered.reduce((acc, row) => {
        if (!acc[row.styleNumber]) {
          acc[row.styleNumber] = {
            styleNumber: row.styleNumber,
            description: row.description,
            variants: [],
          };
        }
        acc[row.styleNumber].variants.push(row.colorName);
        return acc;
      }, {} as Record<string, { styleNumber: string; description: string; variants: string[] }>)
    );

    setDisplayedStyles(grouped);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container fluid className="mt-3">
      <SearchPanel
        filters={filters}
        allOptions={allOptions}
        onChangeFilter={handleChangeFilter}
        onSearch={handleSearch}
      />

      <Row xs={1} md={2} className="g-4 mt-3">
        {displayedStyles.map((style) => (
          <Col key={style.styleNumber}>
            <StyleCard style={style} editable />
          </Col>
        ))}
      </Row>
    </Container>
  );
}