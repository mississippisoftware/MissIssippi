import React from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";

interface SearchPanelProps {
    allOptions: string[];
    selectedOptions: string[];
    onSelectOptions: (values: string[]) => void;
    onSearch: () => void;
}

export default function SearchPanel({
    allOptions,
    selectedOptions,
    onSelectOptions,
    onSearch,
}: SearchPanelProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // Convert selected options to array of strings
        const selected = Array.from(e.target.selectedOptions, (opt) => opt.value).slice(0, 4);
        onSelectOptions(selected);
    };

    return (
        <Card className="mb-3 p-3">
            <Row>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Search By</Form.Label>
                        <Form.Select disabled>
                            <option value="style">Style Number</option>
                        </Form.Select>
                    </Form.Group>
                </Col>

                <Col md={9}>
                    <Form.Group>
                        <Form.Label>Select Styles (max 4)</Form.Label>
                        <Form.Control
                            as="select"
                            multiple
                            value={selectedOptions}
                            onChange={handleChange}
                        >
                            {allOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Button className="mt-2" onClick={onSearch}>
                        Search
                    </Button>
                </Col>
            </Row>
        </Card>
    );
}