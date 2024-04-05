function init_GPU(data) {
	try {
		return new window.GPU.GPU(data);
	} catch (e) {
		return new GPU(data);
	}
}
