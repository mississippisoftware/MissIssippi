import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Container, Form, Row, Table } from "react-bootstrap";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useInventoryEditStore } from "../stores/InventoryEditStore";

export default function InventoryEdit() {
  const toastRef = useRef<Toast>(null);
  const [form, setForm] = useState({
    styleNumber: "",
    description: "",
    colorName: "",
    seasonName: "",
  });

  const results = useInventoryEditStore((s) => s.results);
  const sizeColumns = useInventoryEditStore((s) => s.sizeColumns);
  const loading = useInventoryEditStore((s) => s.loading);
  const searching = useInventoryEditStore((s) => s.searching);
  const initializeSizes = useInventoryEditStore((s) => s.initializeSizes);
  const search = useInventoryEditStore((s) => s.search);
  const updateCell = useInventoryEditStore((s) => s.updateCell);
  const saveByStyle = useInventoryEditStore((s) => s.saveByStyle);

  useEffect(() => {
    initializeSizes();
  }, [initializeSizes]);

  const groupedByStyle = useMemo(() => {
    const groups: Record<string, { description?: string; rows: typeof results }> = {};
    results.forEach((row) => {
      if (!groups[row.styleNumber]) {
        groups[row.styleNumber] = {
          description: row.description,
          rows: [],
        };
      }
      groups[row.styleNumber].rows.push(row);
    });
    return groups;
  }, [results]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    await search(form);
  };

  const handleSave = async (styleNumber: string) => {
    try {
      await saveByStyle(styleNumber);
      toastRef.current?.show({ severity: "success", summary: "Saved", detail: `Saved changes for ${styleNumber}` });
    } catch (err: any) {
      console.error(err);
      toastRef.current?.show({ severity: "error", summary: "Error", detail: err?.message ?? "Failed to save" });
    }
  };

  const placeholderImage = "https://via.placeholder.com/200x200?text=Style+Image";

  return (
    <Container fluid className="mt-3">
      <Toast ref={toastRef} position="top-right" />

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-0">Edit Inventory</h2>
              <small className="text-muted">Search for styles to edit size quantities</small>
            </div>
          </div>

          <Form onSubmit={handleSearch}>
            <Row className="gy-3">
              <Col md={3} sm={6}>
                <Form.Label>Style Number</Form.Label>
                <InputText
                  className="w-100"
                  value={form.styleNumber}
                  onChange={(e) => setForm((f) => ({ ...f, styleNumber: e.target.value }))}
                  placeholder="e.g. ST-1234"
                />
              </Col>
              <Col md={3} sm={6}>
                <Form.Label>Description</Form.Label>
                <InputText
                  className="w-100"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Keywords"
                />
              </Col>
              <Col md={3} sm={6}>
                <Form.Label>Color</Form.Label>
                <InputText
                  className="w-100"
                  value={form.colorName}
                  onChange={(e) => setForm((f) => ({ ...f, colorName: e.target.value }))}
                  placeholder="Color name"
                />
              </Col>
              <Col md={3} sm={6}>
                <Form.Label>Season</Form.Label>
                <InputText
                  className="w-100"
                  value={form.seasonName}
                  onChange={(e) => setForm((f) => ({ ...f, seasonName: e.target.value }))}
                  placeholder="Season"
                />
              </Col>
            </Row>
            <div className="d-flex gap-2 mt-3">
              <Button type="submit" disabled={searching} variant="primary">
                {searching ? "Searching..." : "Search"}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => setForm({ styleNumber: "", description: "", colorName: "", seasonName: "" })}
              >
                Clear
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <ProgressSpinner />
        </div>
      ) : null}

      {!loading && !searching && results.length === 0 && (
        <div className="text-center text-muted">Search to load styles and start editing.</div>
      )}

      {searching && (
        <div className="d-flex justify-content-center py-4">
          <ProgressSpinner />
        </div>
      )}

      {Object.entries(groupedByStyle).map(([styleNumber, info]) => (
        <Card key={styleNumber} className="mb-4 shadow-sm" style={{ minHeight: "420px" }}>
          <Card.Header className="bg-white border-0" style={{ flex: "0 0 40%" }}>
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex flex-column">
                  <span className="fw-bold" style={{ fontSize: "1.4rem" }}>{styleNumber}</span>
                  <span className="text-muted">{info.description || "No description"}</span>
                </div>
              </Col>
              <Col md={4} className="text-md-end text-center">
                <img src={placeholderImage} alt="style" style={{ maxHeight: "140px", objectFit: "cover" }} />
              </Col>
            </Row>
          </Card.Header>
          <Card.Body style={{ flex: "1 1 60%" }}>
            <Table responsive bordered hover>
              <thead className="table-light">
                <tr>
                  <th style={{ minWidth: 140 }}>Color</th>
                  {sizeColumns.map((size) => (
                    <th key={size.sizeId} className="text-center">{size.sizeName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {info.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold align-middle">{row.colorName}</td>
                    {sizeColumns.map((size) => {
                      const cell = row.sizes[size.sizeName];
                      return (
                        <td key={`${row.id}-${size.sizeId}`} className="align-middle text-center">
                          <InputNumber
                            value={cell?.qty ?? 0}
                            onValueChange={(e) => updateCell(row.styleNumber, row.colorName, size.sizeName, Number(e.value ?? 0))}
                            min={0}
                            showButtons
                            buttonLayout="stacked"
                            inputClassName="w-100 text-center"
                            style={{ width: "7rem" }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-end">
              <Button variant="success" onClick={() => handleSave(styleNumber)}>Save Changes</Button>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
}
