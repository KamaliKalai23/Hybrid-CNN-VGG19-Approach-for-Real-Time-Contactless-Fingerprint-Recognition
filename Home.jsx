import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const Home = ({ setx }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Our Platform</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.registerButton]}
          onPress={() => setx(1)}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => setx(2)}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa", // Light background similar to Bootstrap
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0d6efd", // Bootstrap primary color
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 15, // Space between buttons
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  registerButton: {
    backgroundColor: "#0d6efd", // Bootstrap primary (blue)
  },
  loginButton: {
    backgroundColor: "#198754", // Bootstrap success (green)
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Home;
