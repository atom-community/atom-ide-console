import parseText from "../src/parseText"

describe("parseText", () => {
  it("parses url pattern", () => {
    const chunks = parseText("Message: https://facebook.com")
    expect(chunks.length).toBe(3)
    expect(chunks[0]).toBe("Message: ")
    expect(chunks[2]).toBe("")

    const reactElement = chunks[1]
    expect(typeof reactElement).toBe("object") // type React.Element

    if (typeof reactElement === "object") {
      expect(reactElement.type).toBe("a")
      expect(reactElement.props.href).toBe("https://facebook.com")
      expect(reactElement.props.children).toBe("https://facebook.com")
    }
  })
})
