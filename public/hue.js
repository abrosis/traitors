async function changeHueColor(groupName, hexColor, duration) {
    const HUE_BRIDGE_IP = "192.168.1.221";
    const HUE_USERNAME = "1GZa8Kfi9w1j44fuD8HXdk-esGjVCMb7KmZs8dBR";

    // Convert hex to Hue xy color space
    function hexToXy(hex) {
        let r = parseInt(hex.substr(1, 2), 16) / 255;
        let g = parseInt(hex.substr(3, 2), 16) / 255;
        let b = parseInt(hex.substr(5, 2), 16) / 255;

        // Apply gamma correction
        r = (r > 0.04045) ? Math.pow((r + 0.055) / (1.055), 2.4) : r / 12.92;
        g = (g > 0.04045) ? Math.pow((g + 0.055) / (1.055), 2.4) : g / 12.92;
        b = (b > 0.04045) ? Math.pow((b + 0.055) / (1.055), 2.4) : b / 12.92;

        let X = r * 0.664511 + g * 0.154324 + b * 0.162028;
        let Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
        let Z = r * 0.000088 + g * 0.072310 + b * 0.986039;

        let x = X / (X + Y + Z);
        let y = Y / (X + Y + Z);

        return [x || 0, y || 0];
    }

    // Get group ID from group name
    async function getGroupId(groupName) {
        const response = await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/groups`);
        const groups = await response.json();
        for (const [id, group] of Object.entries(groups)) {
            if (group.name === groupName) return id;
        }
        throw new Error(`Group "${groupName}" not found.`);
    }

    // Get original state of lights in the group
    async function getOriginalState(groupId) {
        const response = await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/groups/${groupId}`);
        const group = await response.json();
        const lights = group.lights;
        const originalStates = {};

        for (let light of lights) {
            const lightResponse = await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/lights/${light}`);
            const lightData = await lightResponse.json();
            originalStates[light] = lightData.state;
        }
        return originalStates;
    }

    // Set lights to a new state
    async function setLights(groupId, xy) {
        const groupResponse = await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/groups/${groupId}`);
        const group = await groupResponse.json();
        const lights = group.lights;

        for (let light of lights) {
            await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/lights/${light}/state`, {
                method: "PUT",
                body: JSON.stringify({ xy, on: true, transitiontime: 10 }),
            });
        }
    }

    // Restore original state
    async function restoreLights(originalStates) {
        for (let [light, state] of Object.entries(originalStates)) {
            await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/lights/${light}/state`, {
                method: "PUT",
                body: JSON.stringify({
                    on: state.on,
                    bri: state.bri,
                    xy: state.xy,
                    transitiontime: 10,
                }),
            });
        }
    }

    try {
        const groupId = await getGroupId(groupName);
        const originalState = await getOriginalState(groupId);
        const xy = hexToXy(hexColor);

        // Change to new color
        await setLights(groupId, xy);

        // Wait for the duration
        setTimeout(async () => {
            await restoreLights(originalState);
        }, duration);
    } catch (error) {
        console.error("Error controlling Hue lights:", error);
    }
}
// Change to a specific scene
async function changeToScene(groupName, sceneName) {
    const HUE_BRIDGE_IP = "192.168.1.221";
    const HUE_USERNAME = "1GZa8Kfi9w1j44fuD8HXdk-esGjVCMb7KmZs8dBR";

    // Get group ID from group name
    async function getGroupId(groupName) {
        const response = await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/groups`);
        const groups = await response.json();
        for (const [id, group] of Object.entries(groups)) {
            if (group.name === groupName) return id;
        }
        throw new Error(`Group "${groupName}" not found.`);
    }

    // Get scene ID from scene name
    async function getSceneId(sceneName) {
        const response = await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/scenes`);
        const scenes = await response.json();
        for (const [id, scene] of Object.entries(scenes)) {
            if (scene.name === sceneName) return id;
        }
        throw new Error(`Scene "${sceneName}" not found.`);
    }

    try {
        const groupId = await getGroupId(groupName);
        const sceneId = await getSceneId(sceneName);

        // Activate the scene
        await fetch(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}/groups/${groupId}/action`, {
            method: "PUT",
            body: JSON.stringify({ scene: sceneId }),
        });
    } catch (error) {
        console.error("Error changing to scene:", error);
    }
}

// Example usage: Change 'Living Room' lights to 'Relax' scene

// Example usage: Change 'Living Room' lights to red for 5 seconds

