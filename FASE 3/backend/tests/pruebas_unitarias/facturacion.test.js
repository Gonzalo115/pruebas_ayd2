const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");

const facturacionService = require("../../src/services/facturacion/Facturacion");
const FacturaFEL = require("../../src/models/facturacion/FacturaFel");
const Contrato = require("../../src/models/contratos/Contrato");

describe("Facturacion Service - certificarFactura (Unit)", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("Debería lanzar error 404 si la factura no existe", async () => {
    sinon.stub(FacturaFEL, "buscarPorId").resolves(null);

    try {
      await facturacionService.certificarFactura(99, 1);
      expect.fail("Debería haber lanzado un error");
    } catch (error) {
      expect(error.status).to.equal(404);
      expect(error.message).to.contain("no encontrada");
    }
  });

  it("Debería lanzar error 422 si la factura no está en estado VALIDADA", async () => {
    sinon.stub(FacturaFEL, "buscarPorId").resolves({
      id: 10,
      estado: "BORRADOR",
    });

    try {
      await facturacionService.certificarFactura(10, 1);
      expect.fail("Debería haber lanzado un error");
    } catch (error) {
      expect(error.status).to.equal(422);
      expect(error.message).to.contain("VALIDADA");
    }
  });

  it("Debería certificar, crear CxC y actualizar saldo del contrato correctamente", async () => {
    const mockFactura = {
      id: 10,
      numero_factura: "FAC-001",
      estado: "VALIDADA",
      total_factura: 100,
      contrato_id: 1,
      cliente_id: 1,
      subtotal: 89.29,
      iva: 10.71,
      cliente_email: "test@test.com",
      cliente_nombre: "Cliente Test",
      nit_cliente: "1234567890123",
      nombre_cliente_facturacion: "Cliente Test",
      fecha_emision: "2026-04-14",
      origen: "Ciudad A",
      destino: "Ciudad B",
    };

    const mockContrato = {
      id: 1,
      saldo_usado: 500,
      plazo_pago: 30,
    };

    const mockFacturaCertificada = {
      ...mockFactura,
      estado: "CERTIFICADA",
    };

    const mockCxc = {
      id: 20,
      fecha_vencimiento: "2026-05-14",
    };

    const mockMovimiento = {
      id: 30,
      tipo_movimiento: "CARGO",
      saldo_nuevo: 600,
    };

    sinon.stub(FacturaFEL, "buscarPorId").resolves(mockFactura);
    sinon
      .stub(FacturaFEL, "certificarFactura")
      .resolves(mockFacturaCertificada);
    sinon.stub(Contrato, "buscarPorId").resolves(mockContrato);
    sinon.stub(FacturaFEL, "crearCuentaPorCobrar").resolves(mockCxc);
    sinon.stub(Contrato, "actualizarSaldo").resolves(true);
    sinon
      .stub(FacturaFEL, "registrarMovimientoCredito")
      .resolves(mockMovimiento);

    const result = await facturacionService.certificarFactura(10, 1);

    expect(FacturaFEL.certificarFactura.calledOnce).to.be.true;

    const argsCert = FacturaFEL.certificarFactura.firstCall.args;
    const facturaIdUsado = argsCert[0];
    const certificadoPorUsado = argsCert[1];
    const uuidUsado = argsCert[2];
    const xmlUsado = argsCert[3];
    const pdfUsado = argsCert[4];

    expect(facturaIdUsado).to.equal(10);
    expect(certificadoPorUsado).to.equal(1);
    expect(uuidUsado).to.be.a("string");
    expect(uuidUsado).to.match(
      /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
    );
    expect(xmlUsado).to.be.a("string");
    expect(pdfUsado).to.equal("/facturas/pdf/FAC-001.pdf");

    expect(result.uuid).to.equal(uuidUsado);
    expect(result.mensajeSAT).to.be.a("string");
    expect(result.factura.estado).to.equal("CERTIFICADA");
    expect(result.cuentaPorCobrar.fecha_vencimiento).to.equal("2026-05-14");

    expect(
      FacturaFEL.crearCuentaPorCobrar.calledWith({
        factura_id: 10,
        cliente_id: 1,
        contrato_id: 1,
        monto_original: 100,
        plazo_pago: 30,
      }),
    ).to.be.true;

    expect(Contrato.actualizarSaldo.calledWith(1, 600)).to.be.true;
    expect(FacturaFEL.registrarMovimientoCredito.calledOnce).to.be.true;
  });
});
