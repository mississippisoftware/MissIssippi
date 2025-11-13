import { Card, Row, Col, Form, Button } from "react-bootstrap";
import Select from "react-select";
import type { MultiValue } from "react-select";

interface FilterOption {
    value: string;
    label: string;
}

interface SearchPanelProps {
    filters: Record<string, string[]>;
    allOptions: Record<string, FilterOption[]>;
    onChangeFilter: (filterName: string, selected: string[]) => void;
    onSearch: () => void;
}

export default function SearchPanel({
    filters,
    allOptions,
    onChangeFilter,
    onSearch,
}: SearchPanelProps) {
    return (
        <Card className="mb-3 p-3">
            <Row className="g-3">
                {Object.keys(allOptions).map((filterKey) => (
                    <Col md={3} key={filterKey}>
                        <Form.Group>
                            <Form.Label>{filterKey}</Form.Label>
                            <Select
                                isMulti
                                closeMenuOnSelect={false}
                                options={allOptions[filterKey]}
                                value={allOptions[filterKey].filter((opt) =>
                                    filters[filterKey]?.includes(opt.value)
                                )}
                                onChange={(selected: MultiValue<FilterOption>) =>
                                    onChangeFilter(
                                        filterKey,
                                        selected.map((s) => s.value)
                                    )
                                }
                                placeholder={`Select ${filterKey}...`}
                            />
                        </Form.Group>
                    </Col>
                ))}

                <Col md={3} className="d-flex align-items-end">
                    <Button onClick={onSearch}>Search</Button>
                </Col>
            </Row>
        </Card>
    );
}