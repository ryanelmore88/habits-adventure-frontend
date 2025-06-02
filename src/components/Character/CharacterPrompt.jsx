// src/components/CharacterPrompt.jsx
import React, { useState } from 'react';
import { useCharacter } from '../../contexts/CharacterContext.jsx';
import { fetchCharacter, createCharacter } from '../../api/characterApi';
import Modal from '../Common/Modal.jsx';

export default function CharacterPrompt() {
    const { setCharacterId } = useCharacter();
    const [inputId, setInputId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // modal form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userName, setUserName]         = useState('');
    const [email, setEmail]               = useState('');
    const [charName, setCharName]         = useState('');


    // 1) Fetch existing character
    const handleFetch = async (e) => {
        e.preventDefault();

        if (!inputId.trim()) {
            setError('Please enter a character ID.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const character = await fetchCharacter(inputId.trim());
            if (!character) {
                throw new Error('Character not found');
            }
            setCharacterId(character.id);
        } catch (err) {
            setError(err.message || 'Could not fetch character.');
        } finally {
            setLoading(false);
        }
    };

    // 2) Create new character
    const handleCreateSubmit = async e => {
        e.preventDefault();
        if (!userName.trim() || !email.trim() || !charName.trim()) {
            setError('All fields are required.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const payload = {
                name: charName.trim(),
                // pass userName/email if your backend supports it
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            };
            const { data } = await createCharacter(payload);
            setCharacterId(data.id);
            // setCharacter(data);
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message || 'Failed to create character.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: 20 }}>
            <h2>Load or Create Your Adventurer</h2>

            {/* FETCH FORM */}
            <form onSubmit={handleFetch} style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    value={inputId}
                    onChange={e => setInputId(e.target.value)}
                    placeholder="Enter Character ID"
                    disabled={loading}
                    style={{ padding: 8, width: '60%', marginRight: 8 }}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Loading…' : 'Fetch Character'}
                </button>
            </form>

            <p>— or —</p>

            {/* OPEN CREATE-MODAL BUTTON */}
            <button
                onClick={() => {
                    setError('');
                    setIsModalOpen(true);
                }}
                disabled={loading}
            >
                {loading ? 'Please wait…' : 'Create New Character'}
            </button>

            {error && (
                <p style={{ color: 'salmon', marginTop: 12 }}>{error}</p>
            )}

            {/* CREATE CHARACTER MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h3 style={{ color: '#eee' }}>New Character Details</h3>
                <form onSubmit={handleCreateSubmit}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', marginBottom: 4 }}>
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            disabled={loading}
                            style={{ padding: 8, width: '100%' }}
                        />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', marginBottom: 4 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={loading}
                            style={{ padding: 8, width: '100%' }}
                        />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', marginBottom: 4 }}>
                            Character Name
                        </label>
                        <input
                            type="text"
                            value={charName}
                            onChange={e => setCharName(e.target.value)}
                            disabled={loading}
                            style={{ padding: 8, width: '100%' }}
                        />
                    </div>
                    <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? 'Creating…' : 'Submit'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
