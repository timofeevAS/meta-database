
import React from "react";
import "./QueryResultModal.css";

type QueryResultModalProps = {
    isOpen: boolean;
    onClose: () => void;
    data: any;
};

export const QueryResultModal: React.FC<QueryResultModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    const renderContent = () => {
        if (!data) return <div className="qrm-empty">No data.</div>;

        if (data.result && Array.isArray(data.result) && data.result.length > 0) {
            const keys = Object.keys(data.result[0]);
            return (
                <table className="qrm-table">
                    <thead>
                        <tr>
                            {keys.map((key) => (
                                <th key={key}>{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.result.map((row: any, i: number) => (
                            <tr key={i}>
                                {keys.map((key) => (
                                    <td key={key}>{String(row[key])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        return (
            <pre className="qrm-pre">
                {JSON.stringify(data, null, 2)}
            </pre>
        );
    };

    return (
        <div className="qrm-overlay" onClick={onClose}>
            <div className="qrm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="qrm-header">
                    <h3>Query Result</h3>
                    <button className="qrm-close" onClick={onClose}>×</button>
                </div>
                <div className="qrm-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};