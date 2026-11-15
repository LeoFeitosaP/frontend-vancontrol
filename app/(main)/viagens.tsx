import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    C,
    Panel,
    Pill,
    SectionTitle,
    Shell,
} from "../../components/atelier/ui";
import { useAuth } from "../../hooks/useAuth";
import {
    formatLocalTimeInput,
    isValidLocalTime,
    viagensService,
} from "../../services/api";

function formatDateToBR(date: Date | null): string {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateToAPI(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

// Converte string YYYY-MM-DD (do <input type="date"> na Web) para objeto Date sem erro de fuso
function parseAPIDateToLocal(isoDate: string): Date | null {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatISOStringToBR(isoDate?: string): string {
  if (!isoDate) return "Data não informada";
  const [datePart] = isoDate.split("T");
  const parts = datePart.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function ViagensScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [codigoRota, setCodigoRota] = useState("");
  const [placaVeiculo, setPlacaVeiculo] = useState("");
  const [cpfMotorista, setCpfMotorista] = useState("");

  const [dataViagem, setDataViagem] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const webDateInputRef = useRef<any>(null); // Referência para o input HTML na Web

  const [horarioSaidaPrevisto, setHorarioSaidaPrevisto] = useState("");
  const [horarioChegadaPrevisto, setHorarioChegadaPrevisto] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const canCreate = user?.role === "ADMIN" || user?.role === "MOTORISTA";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const v = await viagensService.listar();
      setItems(Array.isArray(v) ? v : []);
    } catch (e: any) {
      setError(e?.message || "Não foi possível obter viagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setDataViagem(selectedDate);
    }
  };

  // Abre o calendário de acordo com a plataforma
  const handleOpenCalendar = () => {
    if (Platform.OS === "web") {
      // Abre o seletor nativo do navegador (Chrome, Edge, Safari, Firefox)
      if (webDateInputRef.current?.showPicker) {
        webDateInputRef.current.showPicker();
      } else {
        webDateInputRef.current?.focus();
      }
    } else {
      setShowPicker((prev) => !prev);
    }
  };

  const create = async () => {
    const textFields = [
      codigoRota,
      placaVeiculo,
      cpfMotorista,
      horarioSaidaPrevisto,
      horarioChegadaPrevisto,
    ].map((value) => value.trim());

    if (textFields.some((value) => !value) || !dataViagem) {
      setError("Preencha todos os campos para cadastrar a viagem.");
      setMessage("");
      return;
    }

    if (!isValidLocalTime(textFields[3]) || !isValidLocalTime(textFields[4])) {
      setError("Informe os horários no formato HH:mm.");
      setMessage("");
      return;
    }

    setCreating(true);
    setError("");
    setMessage("");

    try {
      await viagensService.criar({
        codigoRota: textFields[0],
        placaVeiculo: textFields[1],
        cpfMotorista: textFields[2],
        dataViagem: formatDateToAPI(dataViagem),
        horarioSaidaPrevisto: textFields[3],
        horarioChegadaPrevisto: textFields[4],
      });

      setMessage("Viagem cadastrada com sucesso.");
      setCodigoRota("");
      setPlacaVeiculo("");
      setCpfMotorista("");
      setDataViagem(null);
      setShowPicker(false);
      setHorarioSaidaPrevisto("");
      setHorarioChegadaPrevisto("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Não foi possível cadastrar a viagem.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Shell
      eyebrow="OPERAÇÕES / VIAGENS"
      title="Cada viagem, organizada."
      description="Consulte viagens registradas na plataforma e acompanhe o histórico disponível."
    >
      {canCreate && (
        <>
          <SectionTitle
            title="Cadastrar viagem"
            caption="Nova saída operacional"
          />
          <Panel padding={16} style={{ gap: 12, marginBottom: 18 }}>
            <TextInput
              value={codigoRota}
              onChangeText={setCodigoRota}
              placeholder="Código da rota (ROT-...)"
              placeholderTextColor={C.faint}
              style={inputStyle}
            />
            <TextInput
              value={placaVeiculo}
              onChangeText={setPlacaVeiculo}
              placeholder="Placa do veículo"
              placeholderTextColor={C.faint}
              autoCapitalize="characters"
              style={inputStyle}
            />
            <TextInput
              value={cpfMotorista}
              onChangeText={setCpfMotorista}
              placeholder="CPF do motorista"
              placeholderTextColor={C.faint}
              keyboardType="numeric"
              style={inputStyle}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Campo unificado: funciona em Web, Android e iOS */}
              <Pressable
                onPress={handleOpenCalendar}
                style={[
                  inputStyle,
                  {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                  },
                ]}
              >
                <Text style={{ color: dataViagem ? C.white : C.faint }}>
                  {dataViagem
                    ? formatDateToBR(dataViagem)
                    : "Data (DD/MM/AAAA)"}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={C.muted} />

                {/* Input HTML oculto usado apenas na Web para disparar o calendário nativo */}
                {Platform.OS === "web" && (
                  <input
                    ref={webDateInputRef}
                    type="date"
                    value={dataViagem ? formatDateToAPI(dataViagem) : ""}
                    onChange={(e) =>
                      setDataViagem(parseAPIDateToLocal(e.target.value))
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                    }}
                  />
                )}
              </Pressable>

              <TextInput
                value={horarioSaidaPrevisto}
                onChangeText={(value) =>
                  setHorarioSaidaPrevisto(formatLocalTimeInput(value))
                }
                placeholder="Saída (HH:mm)"
                placeholderTextColor={C.faint}
                style={[inputStyle, { flex: 1 }]}
              />
            </View>

            {/* Calendário nativo apenas para iOS e Android */}
            {showPicker && Platform.OS !== "web" && (
              <View style={{ alignItems: "center" }}>
                <DateTimePicker
                  value={dataViagem || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  themeVariant="dark"
                  onChange={onChangeDate}
                />
                {Platform.OS === "ios" && (
                  <Pressable
                    onPress={() => setShowPicker(false)}
                    style={{
                      alignSelf: "flex-end",
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ color: C.white, fontWeight: "700" }}>
                      Confirmar data
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <TextInput
              value={horarioChegadaPrevisto}
              onChangeText={(value) =>
                setHorarioChegadaPrevisto(formatLocalTimeInput(value))
              }
              placeholder="Chegada (HH:mm)"
              placeholderTextColor={C.faint}
              style={inputStyle}
            />

            <Pressable
              disabled={creating}
              onPress={create}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: C.white,
                alignItems: "center",
                justifyContent: "center",
                opacity: creating ? 0.6 : 1,
              }}
            >
              <Text style={{ color: C.bg, fontWeight: "800" }}>
                {creating ? "Cadastrando..." : "Cadastrar viagem"}
              </Text>
            </Pressable>
          </Panel>
        </>
      )}

      {!!message && (
        <Text style={{ color: C.white, paddingBottom: 15 }}>{message}</Text>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <Pill text={`${items.length} REGISTROS`} />
        <Pressable
          onPress={load}
          style={{ flexDirection: "row", gap: 8, padding: 10 }}
        >
          <Ionicons name="refresh-outline" size={17} color={C.white} />
          <Text style={{ color: C.white, fontSize: 12, fontWeight: "700" }}>
            Atualizar
          </Text>
        </Pressable>
      </View>

      <Panel>
        {loading ? (
          <ActivityIndicator
            color={C.white}
            size="large"
            style={{ marginVertical: 35 }}
          />
        ) : error ? (
          <Text style={{ color: C.muted, lineHeight: 23, paddingVertical: 15 }}>
            {error}
          </Text>
        ) : items.length ? (
          items.map((v, i) => (
            <View
              key={String(v.codigoViagem || v.codigo || i)}
              style={{
                flexDirection: "row",
                gap: 16,
                alignItems: "center",
                paddingVertical: 20,
                borderBottomWidth: i < items.length - 1 ? 1 : 0,
                borderColor: C.line,
              }}
            >
              <View
                style={{
                  backgroundColor: "#272727",
                  width: 45,
                  height: 45,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="navigate-outline" color={C.white} size={20} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text
                  style={{ color: C.white, fontSize: 14, fontWeight: "800" }}
                >
                  Viagem{" "}
                  {v.codigoViagem || v.codigo || String(i + 1).padStart(3, "0")}
                </Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  {formatISOStringToBR(v.dataViagem || v.data)}
                </Text>
              </View>
              <Pill
                text={String(
                  v.viagemConcuida ? "CONCLUÍDA" : v.status || "CADASTRADA",
                )}
              />
            </View>
          ))
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 13 }}>
            <Ionicons name="calendar-outline" size={31} color={C.muted} />
            <Text style={{ color: C.white, fontWeight: "800" }}>
              Nenhuma viagem encontrada.
            </Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>
              Os registros aparecerão aqui quando forem cadastrados.
            </Text>
          </View>
        )}
      </Panel>
    </Shell>
  );
}

const inputStyle = {
  height: 46,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: C.line,
  backgroundColor: "#1B1B1B",
  color: C.white,
  paddingHorizontal: 14,
};
